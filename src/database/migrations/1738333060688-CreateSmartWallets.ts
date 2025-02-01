import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSmartWallets1738333060688 implements MigrationInterface {
    name = 'CreateSmartWallets1738333060688'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`smart_wallets\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`address\` varchar(255) NOT NULL,
                \`name\` varchar(255) NULL,
                \`category\` enum('whale', 'arbitrage', 'bot', 'early', 'developer') NOT NULL,
                \`transaction_count\` int NOT NULL DEFAULT '0',
                \`win_rate\` decimal(5,2) NOT NULL DEFAULT '0.00',
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`IDX_smart_wallet_address_category\` (\`address\`, \`category\`),
                INDEX \`IDX_smart_wallet_address\` (\`address\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`smart_wallets\``);
    }
} 