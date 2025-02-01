import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('transactions')
export class Transaction {
    @PrimaryColumn()
    signature!: string;

    @Column()
    @Index()
    tokenAddress!: string;

    @Column('decimal', { precision: 20, scale: 9 })
    amount!: number;

    @Column()
    sender!: string;

    @CreateDateColumn()
    @Index()
    timestamp!: Date;

    constructor() {
        this.timestamp = new Date();
    }
} 