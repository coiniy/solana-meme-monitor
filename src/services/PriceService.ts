import axios from 'axios';
import { CONFIG } from '../config';
import { DatabaseService } from './DatabaseService';

export class PriceService {
    private prices: Map<string, number> = new Map();

    constructor(private db: DatabaseService) { }

    async start() {
        this.updatePrices();
        setInterval(() => this.updatePrices(), CONFIG.PRICE_API.UPDATE_INTERVAL);
    }

    private async updatePrices() {
        try {
            // 这里使用 CoinGecko API 获取价格
            const response = await axios.get(
                `${CONFIG.PRICE_API.ENDPOINT}/simple/price`,
                {
                    params: {
                        ids: Array.from(this.getTrackedTokens()),
                        vs_currencies: 'usd'
                    }
                }
            );

            for (const [id, data] of Object.entries(response.data)) {
                const price = (data as any).usd;
                this.prices.set(id, price);

                // 保存价格数据到数据库
                await this.db.saveTokenPrice(id, price);
            }
        } catch (error) {
            console.error('更新价格失败:', error);
        }
    }

    private getTrackedTokens(): Set<string> {
        // 实现获取需要追踪价格的代币列表
        return new Set();
    }

    getPrice(tokenAddress: string): number | null {
        return this.prices.get(tokenAddress) || null;
    }
} 