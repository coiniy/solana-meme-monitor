import { DataSource } from 'typeorm';
import { CONFIG } from '../config/index.js';
import { SmartWallet } from '../entities/SmartWallet.js';
import { Transaction } from '../entities/Transaction.js';
import { TokenPrice } from '../entities/TokenPrice.js';
import { RpcEndpoint } from '../entities/RpcEndpoint.js';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: CONFIG.DATABASE.HOST,
    port: CONFIG.DATABASE.PORT,
    username: CONFIG.DATABASE.USERNAME,
    password: CONFIG.DATABASE.PASSWORD,
    database: CONFIG.DATABASE.DATABASE,
    synchronize: false, // 生产环境禁用自动同步
    logging: false,
    entities: [SmartWallet, Transaction, TokenPrice, RpcEndpoint],
    migrations: process.env.NODE_ENV === 'production'
        ? ['dist/database/migrations/*.js']  // 生产环境使用编译后的 JS 文件
        : ['src/database/migrations/*.ts'],  // 开发环境使用 TS 文件
    subscribers: [],
}); 