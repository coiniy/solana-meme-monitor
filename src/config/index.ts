export const CONFIG = {
    SOLANA: {
        RPC_ENDPOINT: process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
        WS_ENDPOINT: process.env.SOLANA_WS_ENDPOINT || 'wss://api.mainnet-beta.solana.com'
    },
    MONITOR: {
        SPL_TOKEN: process.env.MONITOR_SPL_TOKEN || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        JUPITER_V6: process.env.MONITOR_JUPITER_V6 || 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
        RAYDIUM_V4: process.env.MONITOR_RAYDIUM_V4 || 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
        ORCA_WHIRLPOOL: process.env.MONITOR_ORCA_WHIRLPOOL || 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'
    },
    MIN_TRANSACTION_SIZE: Number(process.env.MIN_TRANSACTION_SIZE) || 10,
    MIN_TRANSACTIONS_FOR_TRENDING: Number(process.env.MIN_TRANSACTIONS_FOR_TRENDING) || 50,
    MONITORING_TIMEFRAME_MINUTES: Number(process.env.MONITORING_TIMEFRAME_MINUTES) || 60,
    SMART_WALLET_MIN_BALANCE: Number(process.env.SMART_WALLET_MIN_BALANCE) || 1000
}; 