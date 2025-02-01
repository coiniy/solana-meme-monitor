import { DataSource } from 'typeorm';
import { CONFIG } from '../config';
import { Transaction } from '../entities/Transaction';
import { TokenPrice } from '../entities/TokenPrice';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: CONFIG.DATABASE.HOST,
    port: CONFIG.DATABASE.PORT,
    username: CONFIG.DATABASE.USERNAME,
    password: CONFIG.DATABASE.PASSWORD,
    database: CONFIG.DATABASE.DATABASE,
    synchronize: false, // 生产环境禁用自动同步
    logging: true,
    entities: [Transaction, TokenPrice],
    migrations: ['src/database/migrations/*.ts'],
    subscribers: [],
}); 