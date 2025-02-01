import { AppDataSource } from '../database/data-source';
import { SmartWallet } from '../entities/SmartWallet';
import { Transaction } from '../entities/Transaction';
import { TokenPrice } from '../entities/TokenPrice';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

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

    async saveTransaction(data: {
        signature: string;
        tokenAddress: string;
        amount: number;
        sender: string;
    }) {
        const transaction = new Transaction();
        Object.assign(transaction, data);
        return await AppDataSource.manager.save(Transaction, transaction);
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
                timestamp: MoreThanOrEqual(timestamp)
            },
            order: {
                timestamp: 'DESC'
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
            .where('tx.timestamp >= :timestamp', { timestamp })
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
                timestamp: MoreThanOrEqual(timestamp)
            },
            order: {
                timestamp: 'DESC'
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