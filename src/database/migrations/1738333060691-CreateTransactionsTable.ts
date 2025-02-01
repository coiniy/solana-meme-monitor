import { MigrationInterface, QueryRunner, Table } from "typeorm"

export class CreateTransactionsTable1738333060691 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "transactions",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                        comment: "自增主键"
                    },
                    {
                        name: "signature",
                        type: "varchar",
                        length: "128",
                        isUnique: true,
                        isNullable: false,
                        comment: "交易签名"
                    },
                    {
                        name: "token_address",
                        type: "varchar",
                        length: "64",
                        isNullable: false,
                        comment: "代币地址"
                    },
                    {
                        name: "token_name",
                        type: "varchar",
                        length: "128",
                        isNullable: true,
                        comment: "代币名称"
                    },
                    {
                        name: "amount",
                        type: "decimal",
                        precision: 20,
                        scale: 6,
                        isNullable: false,
                        comment: "交易金额"
                    },
                    {
                        name: "sender",
                        type: "varchar",
                        length: "64",
                        isNullable: false,
                        comment: "发送方地址"
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        comment: "创建时间"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                        comment: "更新时间"
                    }
                ],
                indices: [
                    {
                        name: "idx_signature",
                        columnNames: ["signature"]
                    },
                    {
                        name: "idx_token_address",
                        columnNames: ["token_address"]
                    },
                    {
                        name: "idx_sender",
                        columnNames: ["sender"]
                    },
                    {
                        name: "idx_created_at",
                        columnNames: ["created_at"]
                    }
                ]
            }),
            true
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("transactions")
    }

} 