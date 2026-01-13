#!/bin/bash
# 家庭记账系统 - 云服务器一键更新脚本
# 使用方法: chmod +x update-cloud.sh && ./update-cloud.sh

set -e

echo "=========================================="
echo "  家庭记账系统 - 更新"
echo "=========================================="

cd /opt/family-accounting

echo ""
echo "[1/4] 拉取最新镜像..."
docker-compose -f docker-compose.cloud.yml pull

echo ""
echo "[2/4] 重启服务..."
docker-compose -f docker-compose.cloud.yml up -d

echo ""
echo "[3/4] 等待服务启动..."
sleep 10

echo ""
echo "[4/4] 执行数据库迁移..."
curl -X POST http://localhost:3000/api/migration/run || echo "迁移接口调用失败，请手动检查"

echo ""
echo "[5/5] 清理旧镜像..."
docker image prune -f

echo ""
echo "=========================================="
echo "  更新完成！"
echo "=========================================="
echo ""
echo "访问地址: http://www.gxc1994.top:3000"
