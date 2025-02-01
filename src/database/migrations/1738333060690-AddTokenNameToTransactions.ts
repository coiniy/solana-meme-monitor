import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTokenNameToTransactions1738333060690 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "transactions",
            new TableColumn({
                name: "token_name",
                type: "varchar",
                length: "100",
                isNullable: true
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("transactions", "token_name");
    }
} 