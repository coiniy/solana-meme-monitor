import { Connection, PublicKey, ParsedTransactionWithMeta, Logs, PartiallyDecodedInstruction, ParsedInstruction, ConnectionConfig } from '@solana/web3.js';
import { CONFIG } from '../config/index.js';
import { DatabaseService } from './DatabaseService.js';
import { PriceService } from './PriceService.js';
import { PatternAnalyzer } from './PatternAnalyzer.js';
import { NotificationService } from './NotificationService.js';
import { SmartWallet, WalletCategory } from '../entities/SmartWallet.js';
import { AppDataSource } from '../database/data-source.js';
import { RpcEndpointService } from './RpcEndpointService.js';

export class TransactionMonitor {
    private connection: Connection;
    private tokenTransactions: Map<string, number> = new Map();
    private priceService: PriceService;
    private patternAnalyzer: PatternAnalyzer;
    private notificationService: NotificationService;
    private lastSignature?: string;  // 用于记录上次查询的最后一笔交易
    private pollingTimer?: NodeJS.Timeout;
    private readonly POLLING_INTERVAL = Number(process.env.POLLING_INTERVAL) || 30000;
    private readonly BATCH_SIZE = Number(process.env.BATCH_SIZE) || 100;
    private readonly PROGRAMS = {
        JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
        RAYDIUM_V4: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK'
    };
    private readonly SPL_TOKEN = process.env.MONITOR_SPL_TOKEN || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
    private readonly rpcEndpointService: RpcEndpointService;

    constructor(
        private readonly dbService: DatabaseService,
        rpcEndpointService?: RpcEndpointService
    ) {
        const config: ConnectionConfig = {
            commitment: 'confirmed'
        };

        this.connection = new Connection(
            process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
            config
        );

        this.priceService = new PriceService(this.dbService);
        this.patternAnalyzer = new PatternAnalyzer(this.dbService, this.priceService);
        this.notificationService = new NotificationService();
        this.rpcEndpointService = rpcEndpointService || new RpcEndpointService();
    }

    async start() {
        try {
            await this.dbService.initialize();
            await this.priceService.start();
            console.log('开始监控 Solana 交易...');

            // 获取初始签名
            await this.updateLastSignature();

            // 开始轮询
            this.startPolling();

        } catch (error) {
            console.error('启动交易监控失败:', error);
            throw error;
        }
    }

    async stop() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = undefined;
        }
        await this.dbService.cleanup();
    }

    private startPolling() {
        this.pollingTimer = setInterval(async () => {
            try {
                await this.checkNewTransactions();
            } catch (error) {
                console.error('检查新交易失败:', error);
                await this.handleError();
            }
        }, this.POLLING_INTERVAL);
    }

    private async checkNewTransactions() {
        console.log('开始获取新交易...');
        // 获取 Jupiter V6 和 Raydium V4 的交易
        const [jupiterSignatures, raydiumSignatures] = await Promise.all([
            this.connection.getSignaturesForAddress(
                new PublicKey(this.PROGRAMS.JUPITER_V6),
                {
                    until: this.lastSignature,
                    limit: this.BATCH_SIZE
                }
            ),
            this.connection.getSignaturesForAddress(
                new PublicKey(this.PROGRAMS.RAYDIUM_V4),
                {
                    until: this.lastSignature,
                    limit: this.BATCH_SIZE
                }
            )
        ]);

        const signatures = [...jupiterSignatures, ...raydiumSignatures];
        signatures.sort((a, b) => b.blockTime! - a.blockTime!);

        console.log(`获取到 ${signatures.length} 个新交易签名`);
        if (signatures.length === 0) return;

        this.lastSignature = signatures[0].signature;

        let validTransactions = 0;
        let whaleTransactions = 0;

        for (const { signature } of signatures) {
            try {
                const txInfo = await this.connection.getParsedTransaction(signature, {
                    maxSupportedTransactionVersion: 0
                });

                if (!txInfo) continue;

                // 检查是否是 Jupiter 或 Raydium 交易
                const isDexTx = txInfo.transaction.message.instructions.some(ix => {
                    if ('programId' in ix) {
                        const programId = ix.programId.toString();
                        return programId === this.PROGRAMS.JUPITER_V6 ||
                            programId === this.PROGRAMS.RAYDIUM_V4;
                    }
                    return false;
                });

                if (isDexTx) {
                    validTransactions++;
                    // 检查是否是巨鲸交易
                    const sender = this.getSender(txInfo);
                    if (sender) {
                        const existingWallet = await AppDataSource.manager.findOne(SmartWallet, {
                            where: {
                                address: sender,
                                category: WalletCategory.WHALE
                            }
                        });
                        if (existingWallet) {
                            whaleTransactions++;
                        }
                    }

                    await this.analyzeTransaction(txInfo);
                }
            } catch (error) {
                console.error(`处理交易 ${signature} 失败:`, error);
                continue;
            }
        }

        console.log(`处理完成: ${validTransactions}/${signatures.length} 个有效 DEX 交易，其中 ${whaleTransactions} 个巨鲸交易`);
    }

    private async updateLastSignature() {
        const signatures = await this.connection.getSignaturesForAddress(
            new PublicKey(this.PROGRAMS.JUPITER_V6),
            { limit: 1 }
        );

        if (signatures.length > 0) {
            this.lastSignature = signatures[0].signature;
        }
    }

    private async handleError() {
        try {
            const endpoint = await this.rpcEndpointService.getBestEndpoint();
            if (!endpoint) {
                console.error('没有可用的 RPC 节点');
                return;
            }

            this.connection = new Connection(endpoint.httpUrl, {
                commitment: 'confirmed'
            });

            console.log(`切换到节点: ${endpoint.name} (${endpoint.httpUrl})`);
            await this.updateLastSignature();

        } catch (error) {
            console.error('切换 RPC 节点失败:', error);
            // 不退出进程，只退出当前轮询
        }
    }

    private async analyzeTransaction(tx: ParsedTransactionWithMeta) {
        try {
            // 首先检查是否是代币交易
            if (!tx.meta?.postTokenBalances?.length || !tx.meta?.preTokenBalances?.length) {
                return; // 不是代币交易
            }

            const value = this.getTransactionValue(tx);
            if (value < CONFIG.MIN_TRANSACTION_SIZE) return;

            const tokenAddress = this.getTokenAddress(tx);
            if (!tokenAddress) return;

            const tokenName = this.getTokenName(tx);
            const sender = this.getSender(tx);
            if (!sender) return;

            const existingWallet = await AppDataSource.manager.findOne(SmartWallet, {
                where: {
                    address: sender,
                    category: WalletCategory.WHALE
                }
            });

            if (existingWallet) {
                existingWallet.transaction_count += 1;
                await AppDataSource.manager.save(SmartWallet, existingWallet);

                // 更新代币统计，只统计巨鲸交易
                this.updateTokenStats(tokenAddress);

                await this.dbService.saveTransaction({
                    signature: tx.transaction.signatures[0],
                    tokenAddress,
                    tokenName: tokenName || '',
                    amount: value,
                    sender: sender
                });

                const patterns = await this.patternAnalyzer.analyzeToken(tokenAddress);
                if (patterns.length > 0) {
                    const message = this.formatPatternAlert(patterns);
                    await this.notificationService.sendAlert(message);
                }

                console.log(`巨鲸钱包交易: ${sender}, 代币: ${tokenName || tokenAddress}, 金额: ${value}`);
            }

            await this.checkSmartWallet(sender);
        } catch (error) {
            console.error('分析交易失败:', error);
        }
    }

    private async checkSmartWallet(address: string) {
        try {
            // 检查钱包是否已经存在
            const existingWallet = await AppDataSource.manager.findOne(SmartWallet, {
                where: { address }
            });

            if (existingWallet) {
                // 更新交易次数
                existingWallet.transaction_count += 1;
                await AppDataSource.manager.save(SmartWallet, existingWallet);
                return;
            }

            // 获取钱包余额
            const balance = await this.connection.getBalance(new PublicKey(address));
            const balanceInSol = balance / 1e9;

            // 只关注巨鲸钱包（余额大于1000 SOL）
            if (balanceInSol >= 1000) {
                // 创建新的智能钱包记录
                const smartWallet = new SmartWallet();
                smartWallet.address = address;
                smartWallet.category = WalletCategory.WHALE;
                smartWallet.transaction_count = 1;
                smartWallet.win_rate = 0;

                await AppDataSource.manager.save(SmartWallet, smartWallet);
                console.log(`发现新的巨鲸钱包: ${address}, 余额: ${balanceInSol} SOL`);
            }

        } catch (error) {
            console.error('检查智能钱包失败:', error);
        }
    }

    private updateTokenStats(tokenAddress: string) {
        const currentCount = this.tokenTransactions.get(tokenAddress) || 0;
        this.tokenTransactions.set(tokenAddress, currentCount + 1);

        // 检查是否成为热门代币
        if (currentCount + 1 >= CONFIG.MIN_TRANSACTIONS_FOR_TRENDING) {
            console.log(`发现热门代币: ${tokenAddress}`);
        }
    }

    // 类型保护函数
    private isParsedInstruction(instruction: any): instruction is ParsedInstruction {
        return 'program' in instruction && 'parsed' in instruction;
    }

    private getTransactionValue(tx: ParsedTransactionWithMeta): number {
        try {
            // 获取代币交易金额
            const tokenBalance = tx.meta?.postTokenBalances?.[0];
            if (tokenBalance?.uiTokenAmount?.uiAmount) {
                return tokenBalance.uiTokenAmount.uiAmount;
            }
            return 0;
        } catch (error) {
            console.error('获取交易金额失败:', error);
            return 0;
        }
    }

    private getTokenAddress(tx: ParsedTransactionWithMeta): string | null {
        try {
            // 从代币余额变化中获取代币地址
            const tokenBalance = tx.meta?.postTokenBalances?.[0];
            if (tokenBalance?.mint) {
                return tokenBalance.mint;
            }
            return null;
        } catch (error) {
            console.error('获取代币地址失败:', error);
            return null;
        }
    }

    private getSender(tx: ParsedTransactionWithMeta): string | null {
        try {
            if (!tx.meta || !tx.transaction.message.instructions) {
                return null;
            }

            // 首先尝试获取交易的付款人
            const feePayer = tx.transaction.message.accountKeys[0].pubkey.toString();

            // 遍历指令寻找实际的发送方
            for (const instruction of tx.transaction.message.instructions) {
                if (this.isParsedInstruction(instruction) &&
                    instruction.program === 'spl-token') {

                    // 从转账指令中获取发送方
                    if (instruction.parsed.type === 'transferChecked' ||
                        instruction.parsed.type === 'transfer') {
                        return instruction.parsed.info.authority ||
                            instruction.parsed.info.source;
                    }
                }
            }

            // 如果找不到具体的发送方，返回付款人
            return feePayer;
        } catch (error) {
            console.error('获取发送方地址失败:', error);
            return null;
        }
    }

    private getTokenName(tx: ParsedTransactionWithMeta): string | null {
        try {
            if (!tx.meta?.postTokenBalances?.length) return null;

            // 从代币余额信息中获取代币名称
            const tokenInfo = tx.meta.postTokenBalances[0]?.mint;
            if (!tokenInfo) return null;

            // 尝试从指令中获取更多信息
            for (const ix of tx.transaction.message.instructions) {
                if (this.isParsedInstruction(ix) && ix.program === 'spl-token') {
                    const info = ix.parsed?.info;
                    if (info?.mint === tokenInfo) {
                        return info.tokenName || null;
                    }
                }
            }

            return null;
        } catch (error) {
            console.error('获取代币名称失败:', error);
            return null;
        }
    }

    private formatPatternAlert(patterns: any[]): string {
        // 实现警报消息格式化
        return '';
    }
} 