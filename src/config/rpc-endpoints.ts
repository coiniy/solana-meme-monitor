export interface RpcEndpoint {
    http: string;
    ws: string;
    name: string;  // 添加名称以便识别
    priority: number;  // 添加优先级，优先使用更稳定的节点
}

export const RPC_ENDPOINTS: RpcEndpoint[] = [
    {
        name: 'GenesysGo',
        http: 'https://ssc-dao.genesysgo.net',
        ws: 'wss://ssc-dao.genesysgo.net',
        priority: 1
    },
    {
        name: 'Serum',
        http: 'https://solana-api.projectserum.com',
        ws: 'wss://solana-api.projectserum.com',
        priority: 1
    },
    {
        name: 'Ankr',
        http: 'https://rpc.ankr.com/solana',
        ws: 'wss://rpc.ankr.com/solana/ws',
        priority: 2
    },
    {
        name: 'Triton',
        http: 'https://free.rpcpool.com',
        ws: 'wss://free.rpcpool.com',
        priority: 2
    },
    {
        name: 'Solana Default',
        http: 'https://api.mainnet-beta.solana.com',
        ws: 'wss://api.mainnet-beta.solana.com',
        priority: 3  // 官方节点作为最后备选
    }
];

// 获取下一个节点，优先选择高优先级的节点
export function getNextEndpoint(currentIndex: number = -1): RpcEndpoint {
    // 按优先级排序
    const sortedEndpoints = [...RPC_ENDPOINTS].sort((a, b) => a.priority - b.priority);

    // 如果当前索引无效，从头开始
    if (currentIndex < 0 || currentIndex >= sortedEndpoints.length) {
        return sortedEndpoints[0];
    }

    // 获取当前节点的优先级
    const currentPriority = sortedEndpoints[currentIndex].priority;

    // 在相同优先级中循环
    const samePriorityEndpoints = sortedEndpoints.filter(e => e.priority === currentPriority);
    const currentInPriorityIndex = samePriorityEndpoints.findIndex(e =>
        e.http === sortedEndpoints[currentIndex].http
    );

    // 如果当前优先级还有下一个节点，使用它
    if (currentInPriorityIndex < samePriorityEndpoints.length - 1) {
        return samePriorityEndpoints[currentInPriorityIndex + 1];
    }

    // 否则切换到下一个优先级
    const nextPriorityEndpoints = sortedEndpoints.filter(e => e.priority > currentPriority);
    return nextPriorityEndpoints.length > 0 ? nextPriorityEndpoints[0] : sortedEndpoints[0];
}

// 添加健康检查功能
export async function checkEndpointHealth(endpoint: RpcEndpoint): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${endpoint.http}/health`, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        return false;
    }
} 