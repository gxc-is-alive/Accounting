---
inclusion: always
---

# 部署配置说明

## 镜像仓库地址

阿里云镜像仓库：`crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com`

镜像地址：

- Backend: `crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com/family-accounting/backend:latest`
- Frontend: `crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com/family-accounting/frontend:latest`

## 部署方式

使用 docker-compose 多容器部署（backend + frontend + mysql），不是 All-in-One。

## 本地构建和推送

```bash
# 构建后端镜像
docker build --no-cache -t crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com/family-accounting/backend:latest -f backend/Dockerfile backend

# 构建前端镜像
docker build --no-cache -t crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com/family-accounting/frontend:latest -f frontend/Dockerfile frontend

# 登录镜像仓库
docker login crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com

# 推送镜像
docker push crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com/family-accounting/backend:latest
docker push crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com/family-accounting/frontend:latest
```

## 云服务器部署

服务器 IP: `43.142.55.49`
域名: `www.gxc1994.top`
端口: `3000`

首次部署：

```bash
chmod +x deploy-cloud.sh && ./deploy-cloud.sh
```

更新部署：

```bash
chmod +x update-cloud.sh && ./update-cloud.sh
```

## 重要文件

- `deploy-cloud.sh` - 云服务器首次部署脚本
- `update-cloud.sh` - 云服务器更新脚本
- `docker-compose.cloud.yml` - 云服务器 docker-compose 配置（由 deploy-cloud.sh 生成）
- `backend/Dockerfile` - 后端 Dockerfile
- `frontend/Dockerfile` - 前端 Dockerfile

## 注意事项

1. 不要使用 All-in-One 部署方式，已删除相关文件
2. 构建时使用 `--no-cache` 确保代码更新生效
3. 数据持久化使用命名卷，更新不会丢失数据
