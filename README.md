# 家庭记账系统

一个功能完善的家庭记账 Web 应用，支持个人和家庭账目管理、AI 智能分析等功能。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite + Pinia + Element Plus
- **后端**: Node.js + Express + TypeScript + Sequelize
- **数据库**: MySQL
- **AI**: DeepSeek API

## 功能特性

- 用户认证（注册、登录、JWT）
- 多账户管理（现金、银行卡、支付宝、微信等）
- 交易记录（收入/支出）
- 分类管理（系统预设 + 自定义）
- 账单类型管理
- 家庭功能（创建家庭、邀请成员、家庭账目）
- 统计报表（月度、年度、分类统计）
- 预算管理（预算设置、预警提醒）
- AI 智能功能（自然语言记账、消费分析、问答）

## 快速开始

### 1. 数据库配置

```sql
-- 创建数据库
CREATE DATABASE family_accounting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

然后执行 `backend/src/scripts/initDb.sql` 初始化表结构和预设数据。

### 2. 后端配置

```bash
cd backend

# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 文件，配置数据库和 API Key
```

### 3. 前端配置

```bash
cd frontend

# 安装依赖
npm install
```

### 4. 启动服务

```bash
# 启动后端（在 backend 目录）
npm run dev

# 启动前端（在 frontend 目录）
npm run dev
```

### 5. 访问应用

- 前端: http://localhost:5173
- 后端 API: http://localhost:3000

## 环境变量说明

### 后端 (.env)

| 变量             | 说明             | 示例              |
| ---------------- | ---------------- | ----------------- |
| PORT             | 服务端口         | 3000              |
| DB_HOST          | 数据库主机       | localhost         |
| DB_PORT          | 数据库端口       | 3306              |
| DB_NAME          | 数据库名         | family_accounting |
| DB_USER          | 数据库用户       | root              |
| DB_PASSWORD      | 数据库密码       | your_password     |
| JWT_SECRET       | JWT 密钥         | your_secret       |
| DEEPSEEK_API_KEY | DeepSeek API Key | sk-xxx            |

## API 接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/accounts` - 获取账户列表
- `GET /api/categories` - 获取分类列表
- `GET /api/transactions` - 获取交易记录
- `POST /api/transactions` - 创建交易
- `GET /api/statistics/monthly` - 月度统计
- `POST /api/ai/parse` - AI 解析记账文本
- `POST /api/ai/analyze` - AI 消费分析

## 许可证

MIT
