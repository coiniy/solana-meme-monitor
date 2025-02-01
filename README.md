# Solana Meme Monitor

监控 Solana 链上的 DEX 交易活动，识别热门代币和巨鲸行为。

## 功能特点

- 实时监控 Jupiter V6 和 Raydium V4 的交易
- 识别巨鲸钱包（SOL 余额 >= 1000）
- 追踪热门代币（满足以下条件）:
  - 交易量达到配置阈值
  - 有巨鲸钱包参与交易
- 分析交易模式和趋势
- 支持多个 RPC 节点自动切换
- 数据持久化存储
- 异常情况告警通知

## 环境要求

- Node.js >= 16
- MySQL >= 8.0
- TypeScript >= 4.5

## 安装

```bash
# 安装依赖
pnpm install

# 编译
pnpm build
```

## 配置

复制 `.env.example` 到 `.env` 并配置以下参数：

```env
# Solana RPC 节点
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=solana_monitor

# 监控参数
POLLING_INTERVAL=30000           # 轮询间隔(ms)
BATCH_SIZE=100                   # 每次获取交易数
MIN_TRANSACTION_SIZE=1000        # 最小交易金额
MIN_TRANSACTIONS_FOR_TRENDING=10 # 热门代币最小交易数
```

## 运行

```bash
# 开发环境
pnpm dev

# 生产环境
pnpm start
```

## 数据库迁移

```bash
# 生成迁移
pnpm migration:generate migration_name

# 执行迁移
pnpm migration:run

# 回滚迁移
pnpm migration:revert
```

## 项目结构

```
src/
├── config/          # 配置文件
├── database/        # 数据库相关
├── entities/        # 数据实体
├── services/        # 业务逻辑
└── index.ts         # 入口文件
```

## 监控指标

- 巨鲸钱包标准：SOL 余额 >= 1000
- 热门代币条件：
  - 交易次数达到 MIN_TRANSACTIONS_FOR_TRENDING
  - 有巨鲸钱包参与交易
- 支持的 DEX：
  - Jupiter V6
  - Raydium V4

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT
