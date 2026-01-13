#!/bin/bash
set -e

# 创建日志目录
mkdir -p /var/log/supervisor

# 初始化 MySQL 数据目录（如果是首次启动）
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "==> 初始化 MySQL 数据目录..."
    mysqld --initialize-insecure --user=mysql
    
    echo "==> 启动 MySQL 进行初始化..."
    mysqld --user=mysql &
    MYSQL_PID=$!
    
    # 等待 MySQL 启动
    echo "==> 等待 MySQL 启动..."
    for i in {1..30}; do
        if mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
            break
        fi
        sleep 1
    done
    
    echo "==> 设置 MySQL root 密码..."
    mysql -u root << EOF
ALTER USER 'root'@'localhost' IDENTIFIED BY '${DB_PASSWORD:-root123456}';
FLUSH PRIVILEGES;
EOF
    
    echo "==> 初始化数据库..."
    mysql -u root -p"${DB_PASSWORD:-root123456}" < /app/backend/scripts/initDb.sql
    
    echo "==> 停止初始化 MySQL..."
    kill $MYSQL_PID
    wait $MYSQL_PID 2>/dev/null || true
    
    echo "==> MySQL 初始化完成!"
fi

echo "==> 启动所有服务..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
