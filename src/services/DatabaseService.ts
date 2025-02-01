import { AppDataSource } from '../database/data-source.js';
import { SmartWallet } from '../entities/SmartWallet.js';
import { Transaction } from '../entities/Transaction.js';
import { TokenPrice } from '../entities/TokenPrice.js';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

interface TransactionData {
    signature: string;
    tokenAddress: string;
    tokenName?: string;  // 添加可选的代币名称
    amount: number;
    sender: string;
}

export class DatabaseService {
    private initialized = false;

    async initialize() {
        if (this.initialized) {
            return;
        }

        try {
            if (!AppDataSource.isInitialized) {
                await AppDataSource.initialize();
                console.log('数据库连接成功');
            }
            this.initialized = true;
        } catch (error) {
            console.error('数据库连接失败:', error);
            throw error;
        }
    }

    async saveTransaction(data: TransactionData) {
        const transaction = new Transaction();
        transaction.signature = data.signature;
        transaction.tokenAddress = data.tokenAddress;
        transaction.tokenName = data.tokenName || '';  // 保存代币名称
        transaction.amount = data.amount;
        transaction.sender = data.sender;

        await AppDataSource.manager.save(Transaction, transaction);
    }

    async saveTokenPrice(tokenAddress: string, price: number) {
        const tokenPrice = new TokenPrice();
        tokenPrice.tokenAddress = tokenAddress;
        tokenPrice.price = price;
        tokenPrice.timestamp = new Date();
        return await AppDataSource.manager.save(TokenPrice, tokenPrice);
    }

    async getRecentTransactions(tokenAddress: string, minutes: number) {
        const timestamp = new Date(Date.now() - minutes * 60 * 1000);

        return await AppDataSource.manager.find(Transaction, {
            where: {
                tokenAddress,
                createdAt: MoreThanOrEqual(timestamp)
            },
            order: {
                createdAt: 'DESC'
            }
        });
    }

    async getTokenPriceHistory(tokenAddress: string, minutes: number) {
        const timestamp = new Date(Date.now() - minutes * 60 * 1000);

        return await AppDataSource.manager.find(TokenPrice, {
            where: {
                tokenAddress,
                timestamp: MoreThanOrEqual(timestamp)
            },
            order: {
                timestamp: 'DESC'
            }
        });
    }

    async getTopTokensByVolume(timeWindowMinutes: number, limit: number = 10) {
        const timestamp = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

        return await AppDataSource.manager
            .createQueryBuilder(Transaction, 'tx')
            .select('tx.tokenAddress')
            .addSelect('SUM(tx.amount)', 'volume')
            .where('tx.createdAt >= :timestamp', { timestamp })
            .groupBy('tx.tokenAddress')
            .orderBy('volume', 'DESC')
            .limit(limit)
            .getRawMany();
    }

    async getWhaleTransactions(minAmount: number, timeWindowMinutes: number) {
        const timestamp = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

        return await AppDataSource.manager.find(Transaction, {
            where: {
                amount: MoreThanOrEqual(minAmount),
                createdAt: MoreThanOrEqual(timestamp)
            },
            order: {
                createdAt: 'DESC'
            }
        });
    }

    async cleanup() {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            this.initialized = false;
        }
    }
} 