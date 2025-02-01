import axios, { AxiosError } from 'axios';
import { CONFIG } from '../config/index.js';
import { DatabaseService } from './DatabaseService.js';
import axiosRetry from 'axios-retry';

export class PriceService {
    private prices: Map<string, number> = new Map();
    private readonly axios;
    private readonly API_ENDPOINTS = [
        'https://api.coingecko.com/api/v3',
        'https://pro-api.coingecko.com/api/v3'  // 如果你有 pro 账号
    ];

    // 添加一些示例代币ID，这些是CoinGecko支持的ID
    private readonly DEFAULT_TOKENS = new Set([
        'solana',
        'bonk',
        'dogwifhat',
        'jupiter',
        'raydium',
        'orca'
    ]);

    constructor(private db: DatabaseService) {
        this.axios = axios.create({
            baseURL: process.env.PRICE_API_ENDPOINT,
            timeout: 10000  // 设置10秒超时
        });

        // 配置重试机制
        axiosRetry(this.axios, {
            retries: 3,  // 重试3次
            retryDelay: axiosRetry.exponentialDelay,  // 指数退避延迟
            retryCondition: (error: AxiosError) => {
                // 只对超时和网络错误重试
                return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
                    error.code === 'ETIMEDOUT';
            }
        });
    }

    async start() {
        await this.updatePrices();
        const interval = Number(process.env.PRICE_UPDATE_INTERVAL) || 3600000;
        console.log(`价格更新服务已启动，更新间隔: ${interval / 1000 / 60} 分钟`);
        setInterval(() => this.updatePrices(), interval);
    }

    private async updatePrices() {
        try {
            const tokens = this.getTrackedTokens();
            if (tokens.size === 0) {
                console.log('没有需要追踪的代币，跳过价格更新');
                return;
            }

            console.log('正在更新以下代币的价格:', Array.from(tokens));

            const response = await this.axios.get(
                `/simple/price`,
                {
                    params: {
                        ids: Array.from(tokens).join(','),
                        vs_currencies: 'usd'
                    }
                }
            );

            console.log('价格更新响应:', response.data);

            for (const [id, data] of Object.entries(response.data)) {
                const price = (data as any).usd;
                this.prices.set(id, price);
                try {
                    await this.db.saveTokenPrice(id, price);
                    console.log(`更新${id}价格: $${price}`);
                } catch (saveError) {
                    console.error(`保存${id}价格失败:`, saveError);
                }
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error('更新价格失败:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
            } else if (error instanceof Error) {
                console.error('更新价格失败:', error.message);
            } else {
                console.error('更新价格失败:', error);
            }
        }
    }

    private getTrackedTokens(): Set<string> {
        // 暂时返回默认代币列表
        // 后续可以从数据库或配置中获取需要追踪的代币
        return this.DEFAULT_TOKENS;
    }

    getPrice(tokenAddress: string): number | null {
        return this.prices.get(tokenAddress) || null;
    }

    private async tryAllEndpoints(path: string, params: any) {
        for (const baseURL of this.API_ENDPOINTS) {
            try {
                const response = await axios.get(path, {
                    baseURL,
                    params,
                    timeout: 10000
                });
                return response.data;
            } catch (error) {
                if (error instanceof Error) {
                    console.log(`尝试 ${baseURL} 失败:`, error.message);
                } else {
                    console.log(`尝试 ${baseURL} 失败:`, error);
                }
                continue;
            }
        }
        throw new Error('所有 API 端点都失败了');
    }
} 