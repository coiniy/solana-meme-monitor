import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('token_prices')
export class TokenPrice {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'token_address' })
    @Index()
    tokenAddress!: string;

    @Column('decimal', { precision: 20, scale: 8 })
    price!: number;

    @Column('timestamp')
    @Index()
    timestamp!: Date;

    constructor() {
        this.timestamp = new Date();
    }
} 