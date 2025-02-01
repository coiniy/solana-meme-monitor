# Solana Meme 币监控系统

实时监控 Solana 链上的 Meme 币交易，分析热门代币和智能钱包动向。

## 功能特性

- 🔄 实时监控 Solana 链上交易
- 🔍 识别和追踪热门 Meme 币
- 🧠 多维度智能钱包分析
- 📊 价格监控和趋势分析
- 📱 多渠道通知（Telegram、Discord）
- 📈 交易模式识别
- 🐋 大户操作监控

## 技术栈

- TypeScript
- Node.js
- MySQL + TypeORM
- Solana Web3.js
- CoinGecko API

## 环境要求

- Node.js >= 16
- MySQL >= 8.0
- pnpm >= 8.0

## 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/coiniy/solana-meme-monitor.git
cd solana-meme-monitor

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
```

### 配置

编辑 `.env` 文件，配置以下必要参数：

#### Solana 配置
```ini
# Solana RPC 节点地址，用于连接区块链
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
```

#### 数据库配置
```ini
# MySQL 数据库连接信息
DB_HOST=localhost        # 数据库主机地址
DB_PORT=3306            # 数据库端口
DB_USERNAME=root        # 数据库用户名
DB_PASSWORD=password    # 数据库密码
DB_DATABASE=solana      # 数据库名称
```

#### 监控配置
```ini
# 最小交易金额(SOL)，低于此金额的交易将被忽略
MIN_TRANSACTION_SIZE=10

# 代币在指定时间窗口内的最小交易次数，超过此数量将被标记为热门代币
MIN_TRANSACTIONS_FOR_TRENDING=50

# 监控时间窗口（分钟）
MONITORING_TIMEFRAME_MINUTES=60
```

#### 价格 API 配置
```ini
# CoinGecko API 端点
PRICE_API_ENDPOINT=https://api.coingecko.com/api/v3

# 价格更新间隔（毫秒）
PRICE_UPDATE_INTERVAL=300000  # 5分钟
```

#### 交易模式分析配置
```ini
# 大额交易阈值(SOL)
MIN_WHALE_TRANSACTION_SOL=1000

# 价格泵车检测阈值（百分比）
PUMP_DETECTION_THRESHOLD=20

# 模式分析时间窗口（分钟）
PATTERN_TIME_WINDOW_MINUTES=60
```

#### 通知配置
```ini
# Telegram 机器人配置
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Discord Webhook 配置
DISCORD_WEBHOOK_URL=your_webhook_url
```

#### 监控程序配置
```ini
# SPL Token Program（代币程序）
MONITOR_SPL_TOKEN=TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA

# Jupiter V6（DEX 聚合器）
MONITOR_JUPITER_V6=JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4

# Raydium V4（DEX）
MONITOR_RAYDIUM_V4=CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK

# Orca Whirlpools（DEX）
MONITOR_ORCA_WHIRLPOOL=whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc
```

> 注意：监控程序配置为可选，如果不配置将使用默认地址。这些地址分别用于监控不同类型的交易：
> - SPL Token：所有代币转账
> - Jupiter：DEX 聚合器交易
> - Raydium：AMM 交易

### 运行

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start
```

## 项目结构

```
src/
├── config/         # 配置文件
├── entities/       # TypeORM 实体
├── services/       # 业务逻辑服务
│   ├── DatabaseService.ts    # 数据库服务
│   ├── PriceService.ts       # 价格服务
│   ├── PatternAnalyzer.ts    # 模式分析
│   └── NotificationService.ts # 通知服务
└── types/          # 类型定义
```

## 监控指标

- 交易量突增
- 价格波动异常
- 智能钱包活动
- 代币持有人变化
- 交易频率变化

## 告警规则

- 大额交易监控：> 1000 SOL
- 价格波动：> 20% / 1小时
- 交易量激增：> 50笔 / 1小时
- 智能钱包分类：
  - 大户（Whale）：余额 > 10000 SOL
  - 套利者（Arbitrage）：高频交易（>10笔/小时）
  - 机器人（Bot）：频繁小额交易
  - 早期投资者（Early）：参与首发交易
  - 开发者（Developer）：合约部署者

## 智能钱包追踪

系统会追踪以下智能钱包信息：
- 钱包地址和分类
- 交易次数统计
- 交易胜率分析
- 历史操作记录
- 关联代币分析

智能钱包数据存储在 `smart_wallets` 表中，支持：
- 按分类查询
- 按交易次数排序
- 按胜率筛选
- 地址和分类联合唯一

## 开发

```bash
# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm type-check
```

## 部署

推荐使用 PM2 进行部署：

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start dist/index.js --name solana-monitor
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交改动 (`git commit -m 'feat: 添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 免责声明

本项目仅供学习和研究使用，不构成任何投资建议。使用本项目进行的任何操作，风险自负。
