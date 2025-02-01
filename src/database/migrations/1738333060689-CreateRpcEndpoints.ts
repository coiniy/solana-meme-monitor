import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateRpcEndpoints1738333060689 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "rpc_endpoints",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "100"
                    },
                    {
                        name: "http_url",
                        type: "varchar",
                        length: "255"
                    },
                    {
                        name: "response_time",
                        type: "int",
                        comment: "响应时间(毫秒)"
                    },
                    {
                        name: "success_rate",
                        type: "decimal",
                        precision: 5,
                        scale: 2,
                        comment: "成功率(%)"
                    },
                    {
                        name: "last_check",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "is_active",
                        type: "boolean",
                        default: true
                    },
                    {
                        name: "priority",
                        type: "int",
                        default: 1
                    }
                ]
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("rpc_endpoints");
    }
} 