import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("rpc_endpoints")
export class RpcEndpoint {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ name: "http_url" })
    httpUrl: string;

    @Column({ name: "response_time" })
    responseTime: number;

    @Column({ name: "success_rate", type: "decimal", precision: 5, scale: 2 })
    successRate: number;

    @Column({ name: "last_check" })
    lastCheck: Date;

    @Column({ name: "is_active" })
    isActive: boolean;

    @Column()
    priority: number;
} 