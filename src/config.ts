import dotenv from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
dotenv.config({
    path: resolve(__dirname, '../.env')
});

// 环境变量验证函数
function requireEnv(key: keyof NodeJS.ProcessEnv): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

// 解析数字类型的环境变量
function parseNumber(value: string): number {
    const num = Number(value);
    if (isNaN(num)) {
        throw new Error(`Invalid number value: ${value}`);
    }
    return num;
}

export const CONFIG = {
    // Solana配置
    RPC_ENDPOINT: requireEnv('SOLANA_RPC_ENDPOINT'),

    // 监控配置
    MIN_TRANSACTION_SIZE: parseNumber(requireEnv('MIN_TRANSACTION_SIZE')),
    MIN_TRANSACTIONS_FOR_TRENDING: parseNumber(requireEnv('MIN_TRANSACTIONS_FOR_TRENDING')),
    MONITORING_TIMEFRAME_MINUTES: parseNumber(requireEnv('MONITORING_TIMEFRAME_MINUTES')),

    // 数据库配置
    DATABASE: {
        TYPE: 'mysql' as const,
        HOST: requireEnv('DB_HOST'),
        PORT: parseNumber(requireEnv('DB_PORT')),
        USERNAME: requireEnv('DB_USERNAME'),
        PASSWORD: requireEnv('DB_PASSWORD'),
        DATABASE: requireEnv('DB_DATABASE'),
        SYNCHRONIZE: process.env.NODE_ENV !== 'production'
    },

    // 价格API配置
    PRICE_API: {
        ENDPOINT: requireEnv('PRICE_API_ENDPOINT'),
        UPDATE_INTERVAL: parseNumber(requireEnv('PRICE_UPDATE_INTERVAL'))
    },

    // 交易模式分析配置
    PATTERN_ANALYSIS: {
        MIN_WHALE_TRANSACTION_SOL: parseNumber(requireEnv('MIN_WHALE_TRANSACTION_SOL')),
        PUMP_DETECTION_THRESHOLD: parseNumber(requireEnv('PUMP_DETECTION_THRESHOLD')),
        TIME_WINDOW_MINUTES: parseNumber(requireEnv('PATTERN_TIME_WINDOW_MINUTES'))
    },

    // 通知配置
    NOTIFICATIONS: {
        TELEGRAM_BOT_TOKEN: requireEnv('TELEGRAM_BOT_TOKEN'),
        TELEGRAM_CHAT_ID: requireEnv('TELEGRAM_CHAT_ID'),
        DISCORD_WEBHOOK_URL: requireEnv('DISCORD_WEBHOOK_URL')
    },

    // 监控的程序ID
    MONITOR_PROGRAMS: {
        SPL_TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',  // SPL Token Program
        JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',  // Jupiter V6
        RAYDIUM_V4: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',  // Raydium V4
        ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'  // Orca Whirlpools
    }
} as const;

// 添加运行时类型检查
Object.freeze(CONFIG); 