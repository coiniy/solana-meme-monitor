import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('token_prices')
export class TokenPrice {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    @Index()
    tokenAddress!: string;

    @Column('decimal', { precision: 20, scale: 8 })
    price!: number;

    @CreateDateColumn()
    @Index()
    timestamp!: Date;

    constructor() {
        this.timestamp = new Date();
    }
} 