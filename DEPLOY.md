# 云服务器部署指南

## 前置条件

- 云服务器已安装 Docker CE 和 Docker Compose
- 已登录阿里云镜像仓库（如果镜像仓库是私有的）

## 部署步骤

### 1. 本地构建并推送镜像

在开发机器上执行：

```powershell
# Windows PowerShell
.\deploy.ps1
```

或手动执行：

```bash
# 登录阿里云镜像仓库
docker login registry.cn-hangzhou.aliyuncs.com

# 构建镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/family-accounting/backend:latest ./backend
docker build -t registry.cn-hangzhou.aliyuncs.com/family-accounting/frontend:latest ./frontend

# 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/family-accounting/backend:latest
docker push registry.cn-hangzhou.aliyuncs.com/family-accounting/frontend:latest
```

### 2. 云服务器部署

在云服务器上创建部署目录：

```bash
mkdir -p /opt/family-accounting
cd /opt/family-accounting
```

上传以下文件到服务器：

- `docker-compose.cloud.yml`
- `.env.cloud.example`
- `backend/src/scripts/initDb.sql` → 重命名为 `initDb.sql`

或者直接创建文件：

```bash
# 创建 docker-compose.cloud.yml（内容见项目文件）
vim docker-compose.cloud.yml

# 创建环境变量文件
cp .env.cloud.example .env
vim .env  # 修改密码等配置
```

### 3. 配置环境变量

编辑 `.env` 文件，修改以下配置：

```bash
# 数据库密码（必须修改）
DB_ROOT_PASSWORD=your_strong_root_password
DB_PASSWORD=your_strong_db_password

# JWT 密钥（必须修改，建议 32 位以上随机字符串）
JWT_SECRET=your_very_strong_jwt_secret_key

# DeepSeek API Key（可选，用于 AI 功能）
DEEPSEEK_API_KEY=your_api_key
```

### 4. 登录镜像仓库（如果是私有仓库）

```bash
docker login registry.cn-hangzhou.aliyuncs.com
```

### 5. 拉取镜像并启动

```bash
# 拉取最新镜像
docker-compose -f docker-compose.cloud.yml pull

# 启动服务
docker-compose -f docker-compose.cloud.yml up -d

# 查看服务状态
docker-compose -f docker-compose.cloud.yml ps

# 查看日志
docker-compose -f docker-compose.cloud.yml logs -f
```

### 6. 验证部署

```bash
# 检查后端健康状态
curl http://localhost:3000/health

# 检查前端
curl http://localhost:80
```

## 常用命令

```bash
# 停止服务
docker-compose -f docker-compose.cloud.yml down

# 重启服务
docker-compose -f docker-compose.cloud.yml restart

# 更新镜像并重启
docker-compose -f docker-compose.cloud.yml pull
docker-compose -f docker-compose.cloud.yml up -d

# 查看日志
docker-compose -f docker-compose.cloud.yml logs -f backend
docker-compose -f docker-compose.cloud.yml logs -f frontend

# 进入容器
docker exec -it family-accounting-backend sh
docker exec -it family-accounting-mysql mysql -u root -p
```

## 数据备份

```bash
# 备份数据库
docker exec family-accounting-mysql mysqldump -u root -p family_accounting > backup.sql

# 恢复数据库
docker exec -i family-accounting-mysql mysql -u root -p family_accounting < backup.sql
```

## 端口说明

| 服务  | 端口 | 说明                     |
| ----- | ---- | ------------------------ |
| 前端  | 80   | Web 界面                 |
| 后端  | 3000 | API 服务                 |
| MySQL | 3306 | 数据库（建议不对外暴露） |

## 安全建议

1. 修改所有默认密码
2. 使用强 JWT 密钥
3. 配置防火墙，只开放必要端口（80）
4. 考虑使用 HTTPS（可配置 Nginx 反向代理）
5. 定期备份数据库
