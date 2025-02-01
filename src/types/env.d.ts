declare namespace NodeJS {
    interface ProcessEnv {
        // Solana配置
        SOLANA_RPC_ENDPOINT: string;

        // 数据库配置
        DB_HOST: string;
        DB_PORT: string;
        DB_USERNAME: string;
        DB_PASSWORD: string;
        DB_DATABASE: string;

        // 监控配置
        MIN_TRANSACTION_SIZE: string;
        SMART_WALLET_MIN_BALANCE: string;
        MIN_TRANSACTIONS_FOR_TRENDING: string;
        MONITORING_TIMEFRAME_MINUTES: string;

        // 价格API配置
        PRICE_API_ENDPOINT: string;
        PRICE_UPDATE_INTERVAL: string;

        // 交易模式分析配置
        MIN_WHALE_TRANSACTION_SOL: string;
        PUMP_DETECTION_THRESHOLD: string;
        PATTERN_TIME_WINDOW_MINUTES: string;

        // 通知配置
        TELEGRAM_BOT_TOKEN: string;
        TELEGRAM_CHAT_ID: string;
        DISCORD_WEBHOOK_URL: string;
    }
} 