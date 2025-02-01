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

    @Column({ name: 'transaction_count', default: 0 })
    transaction_count!: number;

    @Column({ name: 'win_rate', default: 0 })
    win_rate!: number;  // 胜率百分比

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at!: Date;

    constructor() {
        this.created_at = new Date();
        this.updated_at = new Date();
    }
} 