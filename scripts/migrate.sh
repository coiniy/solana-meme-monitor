#!/bin/bash

# 运行迁移
echo "Running database migrations..."
pnpm migration:run

# 检查迁移是否成功
if [ $? -eq 0 ]; then
    echo "Database migrations completed successfully"
    exit 0
else
    echo "Database migrations failed"
    exit 1
fi 