FROM node:18-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 编译 TypeScript
RUN pnpm build

# 设置环境变量
ENV NODE_ENV=production

# 启动命令
CMD ["pnpm", "start"] 