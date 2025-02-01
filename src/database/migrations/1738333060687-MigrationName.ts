import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationName1738333060687 implements MigrationInterface {
    name = 'MigrationName1738333060687'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`transactions\` (\`signature\` varchar(255) NOT NULL, \`tokenAddress\` varchar(255) NOT NULL, \`amount\` decimal(20,9) NOT NULL, \`sender\` varchar(255) NOT NULL, \`timestamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_24eefe146fb4a719ecfcfaf1dc\` (\`tokenAddress\`), INDEX \`IDX_4c1bd13826400c29b01b90d523\` (\`timestamp\`), PRIMARY KEY (\`signature\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`token_prices\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tokenAddress\` varchar(255) NOT NULL, \`price\` decimal(20,8) NOT NULL, \`timestamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_5e1795658bcb325898bb67938e\` (\`tokenAddress\`), INDEX \`IDX_cb5b2d2f0d4dd9ba04bb863258\` (\`timestamp\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_cb5b2d2f0d4dd9ba04bb863258\` ON \`token_prices\``);
        await queryRunner.query(`DROP INDEX \`IDX_5e1795658bcb325898bb67938e\` ON \`token_prices\``);
        await queryRunner.query(`DROP TABLE \`token_prices\``);
        await queryRunner.query(`DROP INDEX \`IDX_4c1bd13826400c29b01b90d523\` ON \`transactions\``);
        await queryRunner.query(`DROP INDEX \`IDX_24eefe146fb4a719ecfcfaf1dc\` ON \`transactions\``);
        await queryRunner.query(`DROP TABLE \`transactions\``);
    }

}
