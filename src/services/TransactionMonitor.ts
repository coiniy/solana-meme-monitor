import { Connection, PublicKey, ParsedTransactionWithMeta, Commitment, LogsCallback, TransactionSignature, Logs, TransactionError, PartiallyDecodedInstruction, ParsedInstruction, ConnectionConfig } from '@solana/web3.js';
import { CONFIG } from '../config';
import { DatabaseService } from './DatabaseService';
import { PriceService } from './PriceService';
import { PatternAnalyzer } from './PatternAnalyzer';
import { NotificationService } from './NotificationService';
import { SmartWallet, WalletCategory } from '../entities/SmartWallet';
import { AppDataSource } from '../database/data-source';
import { getNextEndpoint, RPC_ENDPOINTS, checkEndpointHealth } from '../config/rpc-endpoints';
import type { WebSocket } from 'ws';
import { RpcEndpointService } from './RpcEndpointService';

export class TransactionMonitor {
    private connection: Connection;
    private tokenTransactions: Map<string, number> = new Map();
    private smartWallets: Set<string> = new Set();
    private priceService: PriceService;
    private patternAnalyzer: PatternAnalyzer;
    private notificationService: NotificationService;
    private subscriptionId?: number;
    private wsRetryCount = 0;
    private readonly MAX_RETRIES = 5;
    private readonly RETRY_DELAY = 5000;
    private currentRpcIndex = -1;
    private lastSignature?: string;  // 用于记录上次查询的最后一笔交易
    private pollingTimer?: NodeJS.Timeout;
    private readonly POLLING_INTERVAL = Number(process.env.POLLING_INTERVAL) || 30000;
    private readonly BATCH_SIZE = Number(process.env.BATCH_SIZE) || 100;
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
                this.handleError();
            }
        }, this.POLLING_INTERVAL);
    }

    private async checkNewTransactions() {
        try {
            const signatures = await this.connection.getSignaturesForAddress(
                new PublicKey(this.SPL_TOKEN),
                {
                    until: this.lastSignature,
                    limit: this.BATCH_SIZE
                }
            );

            if (signatures.length === 0) {
                return;
            }

            this.lastSignature = signatures[0].signature;

            for (const { signature } of signatures.reverse()) {
                const txInfo = await this.connection.getParsedTransaction(signature);
                if (txInfo) {
                    await this.analyzeTransaction(txInfo);
                }
            }

        } catch (error) {
            console.error('获取交易失败:', error);
            throw error;
        }
    }

    private async updateLastSignature() {
        const signatures = await this.connection.getSignaturesForAddress(
            new PublicKey(this.SPL_TOKEN),
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

    private async processTransaction(logs: Logs) {
        try {
            // 解析交易日志
            const signature = logs.signature;
            const txInfo = await this.connection.getParsedTransaction(signature);

            if (!txInfo || !this.isTokenTransaction(txInfo)) {
                return;
            }

            // 分析交易
            await this.analyzeTransaction(txInfo);

        } catch (error) {
            console.error('处理交易出错:', error);
        }
    }

    private async analyzeTransaction(tx: ParsedTransactionWithMeta) {
        try {
            // 检查交易金额
            const value = this.getTransactionValue(tx);
            if (value < CONFIG.MIN_TRANSACTION_SIZE) {
                return;
            }

            // 获取代币地址
            const tokenAddress = this.getTokenAddress(tx);
            if (!tokenAddress) {
                return;
            }

            // 获取发送方
            const sender = this.getSender(tx);
            if (!sender) {
                return;
            }

            // 检查是否是巨鲸钱包
            const existingWallet = await AppDataSource.manager.findOne(SmartWallet, {
                where: {
                    address: sender,
                    category: WalletCategory.WHALE
                }
            });

            // 更新代币交易计数
            this.updateTokenStats(tokenAddress);

            // 如果是巨鲸钱包，更新交易记录并分析
            if (existingWallet) {
                // 更新交易次数
                existingWallet.transactionCount += 1;
                await AppDataSource.manager.save(SmartWallet, existingWallet);

                // 保存交易数据
                await this.dbService.saveTransaction({
                    signature: tx.transaction.signatures[0],
                    tokenAddress,
                    amount: value,
                    sender: sender
                });

                // 分析交易模式
                const patterns = await this.patternAnalyzer.analyzeToken(tokenAddress);

                // 发送通知
                if (patterns.length > 0) {
                    const message = this.formatPatternAlert(patterns);
                    await this.notificationService.sendAlert(message);
                }

                console.log(`巨鲸钱包交易: ${sender}, 代币: ${tokenAddress}, 金额: ${value}`);
            }

            // 如果不是已知的巨鲸钱包，检查是否符合巨鲸标准
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
                existingWallet.transactionCount += 1;
                await AppDataSource.manager.save(SmartWallet, existingWallet);
                return;
            }

            // 获取钱包余额
            const balance = await this.connection.getBalance(new PublicKey(address));
            const balanceInSol = balance / 1e9;

            // 只关注巨鲸钱包（余额大于10000 SOL）
            if (balanceInSol >= 10000) {
                // 创建新的智能钱包记录
                const smartWallet = new SmartWallet();
                smartWallet.address = address;
                smartWallet.category = WalletCategory.WHALE;
                smartWallet.transactionCount = 1;
                smartWallet.winRate = 0;

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

    private isTokenTransaction(tx: ParsedTransactionWithMeta): boolean {
        try {
            if (!tx.meta || !tx.transaction.message.instructions) {
                return false;
            }

            // 创建程序ID的字符串集合
            const monitoredProgramIds = new Set<string>(
                Object.values(CONFIG.MONITOR_PROGRAMS).map(id => id.toString())
            );

            // 检查交易的指令
            for (const instruction of tx.transaction.message.instructions) {
                // 处理已解析的指令
                if (this.isParsedInstruction(instruction)) {
                    if (instruction.program === 'spl-token') {
                        return true;
                    }
                }
                // 处理部分解码的指令
                else if (this.isPartiallyDecodedInstruction(instruction)) {
                    const programId = instruction.programId.toString();
                    if (monitoredProgramIds.has(programId)) {
                        return true;
                    }
                }
            }

            // 检查内部指令
            if (tx.meta.innerInstructions) {
                for (const inner of tx.meta.innerInstructions) {
                    for (const instruction of inner.instructions) {
                        if (this.isPartiallyDecodedInstruction(instruction)) {
                            const programId = instruction.programId.toString();
                            if (monitoredProgramIds.has(programId)) {
                                return true;
                            }
                        }
                    }
                }
            }

            return false;
        } catch (error) {
            console.error('检查代币交易失败:', error);
            return false;
        }
    }

    // 类型保护函数
    private isParsedInstruction(instruction: any): instruction is ParsedInstruction {
        return 'program' in instruction && 'parsed' in instruction;
    }

    private isPartiallyDecodedInstruction(instruction: any): instruction is PartiallyDecodedInstruction {
        return 'programId' in instruction && instruction.programId instanceof PublicKey;
    }

    private getTransactionValue(tx: ParsedTransactionWithMeta): number {
        try {
            if (!tx.meta || !tx.transaction.message.instructions) {
                return 0;
            }

            // 遍历所有指令寻找 SPL Token 转账
            for (const instruction of tx.transaction.message.instructions) {
                if (this.isParsedInstruction(instruction) &&
                    instruction.program === 'spl-token' &&
                    instruction.parsed.type === 'transferChecked') {

                    const { amount, decimals } = instruction.parsed.info;
                    // 转换为实际数量（考虑代币精度）
                    return Number(amount) / Math.pow(10, decimals);
                }
            }

            // 检查内部指令
            if (tx.meta.innerInstructions) {
                for (const inner of tx.meta.innerInstructions) {
                    for (const instruction of inner.instructions) {
                        if (this.isParsedInstruction(instruction) &&
                            instruction.program === 'spl-token' &&
                            instruction.parsed.type === 'transferChecked') {

                            const { amount, decimals } = instruction.parsed.info;
                            return Number(amount) / Math.pow(10, decimals);
                        }
                    }
                }
            }

            return 0;
        } catch (error) {
            console.error('获取交易金额失败:', error);
            return 0;
        }
    }

    private getTokenAddress(tx: ParsedTransactionWithMeta): string | null {
        try {
            if (!tx.meta || !tx.transaction.message.instructions) {
                return null;
            }

            // 遍历所有指令寻找代币地址
            for (const instruction of tx.transaction.message.instructions) {
                if (this.isParsedInstruction(instruction) &&
                    instruction.program === 'spl-token') {

                    // 从转账指令中获取代币地址
                    if (instruction.parsed.type === 'transferChecked' ||
                        instruction.parsed.type === 'transfer') {
                        return instruction.parsed.info.mint;
                    }

                    // 从其他代币操作中获取代币地址
                    if ('mint' in instruction.parsed.info) {
                        return instruction.parsed.info.mint;
                    }
                }
            }

            // 检查内部指令
            if (tx.meta.innerInstructions) {
                for (const inner of tx.meta.innerInstructions) {
                    for (const instruction of inner.instructions) {
                        if (this.isParsedInstruction(instruction) &&
                            instruction.program === 'spl-token') {

                            if (instruction.parsed.type === 'transferChecked' ||
                                instruction.parsed.type === 'transfer') {
                                return instruction.parsed.info.mint;
                            }
                        }
                    }
                }
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

    private formatPatternAlert(patterns: any[]): string {
        // 实现警报消息格式化
        return '';
    }
} 