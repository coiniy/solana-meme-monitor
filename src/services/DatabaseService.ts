import { AppDataSource } from '../database/data-source';
import { Transaction } from '../entities/Transaction';
import { TokenPrice } from '../entities/TokenPrice';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export class DatabaseService {
    async initialize() {
        try {
            await AppDataSource.initialize();
            console.log('数据库连接成功');
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

        await AppDataSource.manager.save(transaction);
    }

    async saveTokenPrice(tokenAddress: string, price: number) {
        const tokenPrice = new TokenPrice();
        tokenPrice.tokenAddress = tokenAddress;
        tokenPrice.price = price;

        await AppDataSource.manager.save(tokenPrice);
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
} 