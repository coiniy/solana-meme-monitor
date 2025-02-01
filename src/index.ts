import { TransactionMonitor } from './services/TransactionMonitor';

async function main() {
    const monitor = new TransactionMonitor();
    await monitor.start();
}

main().catch(console.error); 