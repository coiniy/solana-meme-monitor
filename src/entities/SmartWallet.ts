import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum WalletCategory {
    WHALE = 'whale',           // 大户
    ARBITRAGE = 'arbitrage',   // 套利
    BOT = 'bot',               // 机器人
    EARLY_INVESTOR = 'early',  // 早期投资者
    DEVELOPER = 'developer'    // 开发者
}

@Entity('smart_wallets')
@Index(['address', 'category'], { unique: true })  // 添加联合唯一索引
export class SmartWallet {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @Index()
    address!: string;

    @Column({ nullable: true })
    name?: string;

    @Column({
        type: 'enum',
        enum: WalletCategory
    })
    category!: WalletCategory;

    @Column({ default: 0 })
    transactionCount!: number;

    @Column('decimal', { precision: 5, scale: 2, default: 0 })
    winRate!: number;  // 胜率百分比

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    constructor() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
} 