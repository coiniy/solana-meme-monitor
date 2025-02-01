import { AppDataSource } from '../database/data-source';
import { RpcEndpoint } from '../entities/RpcEndpoint';
import { Repository } from 'typeorm';

export class RpcEndpointService {
    private repository: Repository<RpcEndpoint>;
    private checkInterval: NodeJS.Timeout;
    private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟检查一次

    constructor() {
        this.repository = AppDataSource.getRepository(RpcEndpoint);
    }

    async start() {
        await this.initializeEndpoints();
        this.startHealthCheck();
    }

    async stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }

    private async initializeEndpoints() {
        const count = await this.repository.count();
        if (count === 0) {
            // 初始化默认节点
            const defaultEndpoints = [
                {
                    name: 'GenesysGo',
                    httpUrl: 'https://ssc-dao.genesysgo.net',
                    priority: 1
                },
                {
                    name: 'Serum',
                    httpUrl: 'https://solana-api.projectserum.com',
                    priority: 1
                },
                // ... 其他节点
            ];

            await Promise.all(
                defaultEndpoints.map(endpoint =>
                    this.repository.save({
                        ...endpoint,
                        responseTime: 0,
                        successRate: 100,
                        lastCheck: new Date(),
                        isActive: true
                    })
                )
            );
        }
    }

    private startHealthCheck() {
        this.checkInterval = setInterval(async () => {
            try {
                await this.checkAllEndpoints();
            } catch (error) {
                console.error('检查 RPC 节点状态失败:', error);
            }
        }, this.CHECK_INTERVAL);
    }

    private async checkAllEndpoints() {
        const endpoints = await this.repository.find();

        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const isHealthy = await this.checkEndpointHealth(endpoint.httpUrl);
                const responseTime = Date.now() - startTime;

                // 更新节点状态
                endpoint.responseTime = responseTime;
                endpoint.lastCheck = new Date();
                endpoint.isActive = isHealthy;

                // 更新成功率
                endpoint.successRate = isHealthy
                    ? Math.min(100, endpoint.successRate + 1)
                    : Math.max(0, endpoint.successRate - 5);

                await this.repository.save(endpoint);

            } catch (error) {
                console.error(`检查节点 ${endpoint.name} 失败:`, error);
            }
        }
    }

    private async checkEndpointHealth(url: string): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "getHealth"
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.result === "ok";
        } catch {
            return false;
        }
    }

    async getBestEndpoint(): Promise<RpcEndpoint | null> {
        return await this.repository.createQueryBuilder("endpoint")
            .where("endpoint.isActive = :isActive", { isActive: true })
            .orderBy("endpoint.priority", "ASC")
            .addOrderBy("endpoint.responseTime", "ASC")
            .addOrderBy("endpoint.successRate", "DESC")
            .getOne();
    }
} 