import { TransactionMonitor } from './services/TransactionMonitor';
import { DatabaseService } from './services/DatabaseService';
import { AppDataSource } from './database/data-source';

async function main() {
    const dbService = new DatabaseService();
    const monitor = new TransactionMonitor(dbService);

    try {
        await monitor.start();
    } catch (error) {
        console.error('程序启动失败:', error);
        await monitor.stop();
        process.exit(1);
    }
}

// 启动程序
main().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
});

// 优雅退出
process.on('SIGINT', async () => {
    console.log('\n正在关闭程序...');
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n正在关闭程序...');
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
    process.exit(0);
}); 