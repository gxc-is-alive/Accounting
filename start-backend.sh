#!/bin/bash
# 等待 MySQL 完全启动

echo "等待 MySQL 启动..."

# 最多等待 60 秒
for i in {1..60}; do
    if mysqladmin ping -h 127.0.0.1 -u root -p"${DB_PASSWORD:-root123456}" --silent 2>/dev/null; then
        echo "MySQL 已就绪，启动后端服务..."
        exec node /app/backend/dist/index.js
    fi
    echo "等待 MySQL... ($i/60)"
    sleep 1
done

echo "MySQL 启动超时，尝试启动后端..."
exec node /app/backend/dist/index.js
