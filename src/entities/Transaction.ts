import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("transactions")
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    signature: string;

    @Column({ name: "token_address" })
    tokenAddress: string;

    @Column({ name: "token_name", type: "varchar", length: 255, nullable: true })
    tokenName: string | null;

    @Column({ type: "decimal", precision: 20, scale: 8 })
    amount: number;

    @Column()
    sender: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
} 