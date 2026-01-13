#!/bin/bash
# 家庭记账系统 - 云服务器一键部署脚本
# 使用方法: curl -sSL https://raw.githubusercontent.com/xxx/deploy.sh | bash
# 或者: chmod +x deploy-cloud.sh && ./deploy-cloud.sh

set -e

echo "=========================================="
echo "  家庭记账系统 - 云服务器部署"
echo "=========================================="

# 创建目录
mkdir -p /opt/family-accounting
cd /opt/family-accounting

# 登录镜像仓库
echo ""
echo "[1/4] 登录阿里云镜像仓库..."
docker login crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com

# 创建 docker-compose.cloud.yml
echo ""
echo "[2/4] 创建配置文件..."
cat > docker-compose.cloud.yml << 'COMPOSEEOF'
services:
  mysql:
    image: mysql:8.0
    container_name: family-accounting-mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --init-connect='SET NAMES utf8mb4'
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-root123456}
      MYSQL_DATABASE: ${DB_NAME:-family_accounting}
      MYSQL_USER: ${DB_USER:-accounting}
      MYSQL_PASSWORD: ${DB_PASSWORD:-accounting123}
      LANG: C.UTF-8
    volumes:
      - mysql_data:/var/lib/mysql
      - ./initDb.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot123456"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
    restart: unless-stopped
    networks:
      - app-network

  backend:
    image: crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com/family-accounting/backend:latest
    container_name: family-accounting-backend
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=${DB_NAME:-family_accounting}
      - DB_USER=${DB_USER:-accounting}
      - DB_PASSWORD=${DB_PASSWORD:-accounting123}
      - JWT_SECRET=${JWT_SECRET:-family_accounting_jwt_secret_2024}
      - JWT_EXPIRES_IN=7d
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY:-}
      - DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    image: crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com/family-accounting/frontend:latest
    container_name: family-accounting-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network

volumes:
  mysql_data:
    name: family-accounting-mysql-data
  uploads_data:
    name: family-accounting-uploads

networks:
  app-network:
    driver: bridge
COMPOSEEOF

# 创建 .env 文件
cat > .env << 'ENVEOF'
DB_ROOT_PASSWORD=root123456
DB_PASSWORD=accounting123
JWT_SECRET=family_accounting_jwt_secret_2024
DEEPSEEK_API_KEY=
ENVEOF

# 创建数据库初始化脚本
cat > initDb.sql << 'SQLEOF'
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS family_accounting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE family_accounting;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS families (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS family_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_family_user (family_id, user_id)
);

CREATE TABLE IF NOT EXISTS family_invites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('cash', 'bank', 'alipay', 'wechat', 'credit', 'other') NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    icon VARCHAR(50),
    credit_limit DECIMAL(15, 2),
    billing_day TINYINT,
    due_day TINYINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    icon VARCHAR(50) DEFAULT 'default',
    parent_id INT,
    is_system BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bill_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    icon VARCHAR(50) DEFAULT 'default',
    is_system BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    family_id INT,
    account_id INT NOT NULL,
    category_id INT NOT NULL,
    bill_type_id INT NOT NULL,
    type ENUM('income', 'expense', 'repayment') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    note VARCHAR(500),
    is_family BOOLEAN DEFAULT FALSE,
    source_account_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (bill_type_id) REFERENCES bill_types(id),
    FOREIGN KEY (source_account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS budgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT,
    amount DECIMAL(15, 2) NOT NULL,
    month VARCHAR(7) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category_month (user_id, category_id, month)
);

CREATE TABLE IF NOT EXISTS token_blacklist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(500) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, type, icon, is_system, sort_order) VALUES
('餐饮', 'expense', 'food', TRUE, 1),('早餐', 'expense', 'breakfast', TRUE, 2),('午餐', 'expense', 'lunch', TRUE, 3),('晚餐', 'expense', 'dinner', TRUE, 4),('外卖', 'expense', 'takeaway', TRUE, 5),('零食饮料', 'expense', 'snack', TRUE, 6),('水果', 'expense', 'fruit', TRUE, 7),('买菜', 'expense', 'vegetable', TRUE, 8),
('交通', 'expense', 'car', TRUE, 10),('公交地铁', 'expense', 'subway', TRUE, 11),('打车', 'expense', 'taxi', TRUE, 12),('共享单车', 'expense', 'bike', TRUE, 13),('加油', 'expense', 'fuel', TRUE, 14),('停车费', 'expense', 'parking', TRUE, 15),('车辆保养', 'expense', 'car-service', TRUE, 16),('火车票', 'expense', 'train', TRUE, 17),('机票', 'expense', 'flight', TRUE, 18),
('购物', 'expense', 'shopping', TRUE, 20),('日用品', 'expense', 'daily-use', TRUE, 21),('服饰', 'expense', 'clothes', TRUE, 22),('数码产品', 'expense', 'digital', TRUE, 23),('家居用品', 'expense', 'furniture', TRUE, 24),('美妆护肤', 'expense', 'cosmetics', TRUE, 25),('母婴用品', 'expense', 'baby', TRUE, 26),('宠物用品', 'expense', 'pet', TRUE, 27),
('居住', 'expense', 'home', TRUE, 30),('房租', 'expense', 'rent', TRUE, 31),('房贷', 'expense', 'mortgage', TRUE, 32),('物业费', 'expense', 'property-fee', TRUE, 33),('水费', 'expense', 'water', TRUE, 34),('电费', 'expense', 'electricity', TRUE, 35),('燃气费', 'expense', 'gas', TRUE, 36),('暖气费', 'expense', 'heating', TRUE, 37),('网费', 'expense', 'internet', TRUE, 38),('家政服务', 'expense', 'housekeeping', TRUE, 39),
('通讯', 'expense', 'phone', TRUE, 40),('话费', 'expense', 'phone-bill', TRUE, 41),('会员订阅', 'expense', 'subscription', TRUE, 42),
('娱乐', 'expense', 'game', TRUE, 50),('电影', 'expense', 'movie', TRUE, 51),('游戏', 'expense', 'gaming', TRUE, 52),('运动健身', 'expense', 'fitness', TRUE, 53),('旅游', 'expense', 'travel', TRUE, 54),('KTV', 'expense', 'ktv', TRUE, 55),('演出门票', 'expense', 'ticket', TRUE, 56),
('医疗', 'expense', 'medical', TRUE, 60),('看病', 'expense', 'hospital', TRUE, 61),('买药', 'expense', 'medicine', TRUE, 62),('体检', 'expense', 'checkup', TRUE, 63),('保健品', 'expense', 'health-product', TRUE, 64),
('教育', 'expense', 'book', TRUE, 70),('书籍', 'expense', 'books', TRUE, 71),('培训课程', 'expense', 'course', TRUE, 72),('学费', 'expense', 'tuition', TRUE, 73),('考试报名', 'expense', 'exam', TRUE, 74),
('人情', 'expense', 'gift', TRUE, 80),('红包', 'expense', 'red-packet', TRUE, 81),('礼金', 'expense', 'gift-money', TRUE, 82),('请客吃饭', 'expense', 'treat', TRUE, 83),('送礼', 'expense', 'present', TRUE, 84),
('金融', 'expense', 'finance', TRUE, 90),('保险', 'expense', 'insurance', TRUE, 91),('信用卡还款', 'expense', 'credit-repay', TRUE, 92),('贷款还款', 'expense', 'loan-repay', TRUE, 93),('手续费', 'expense', 'fee', TRUE, 94),
('其他支出', 'expense', 'other', TRUE, 99);

INSERT INTO categories (name, type, icon, is_system, sort_order) VALUES
('工资', 'income', 'salary', TRUE, 1),('奖金', 'income', 'bonus', TRUE, 2),('加班费', 'income', 'overtime', TRUE, 3),('年终奖', 'income', 'annual-bonus', TRUE, 4),('绩效奖', 'income', 'performance', TRUE, 5),('补贴', 'income', 'allowance', TRUE, 6),
('兼职', 'income', 'parttime', TRUE, 10),('稿费', 'income', 'manuscript', TRUE, 11),('咨询费', 'income', 'consulting', TRUE, 12),('外包收入', 'income', 'outsource', TRUE, 13),
('投资收益', 'income', 'invest', TRUE, 20),('股票收益', 'income', 'stock', TRUE, 21),('基金收益', 'income', 'fund', TRUE, 22),('利息', 'income', 'interest', TRUE, 23),('分红', 'income', 'dividend', TRUE, 24),('房租收入', 'income', 'rental', TRUE, 25),
('红包', 'income', 'redpacket', TRUE, 30),('报销', 'income', 'reimbursement', TRUE, 31),('退款', 'income', 'refund', TRUE, 32),('中奖', 'income', 'lottery', TRUE, 33),('卖闲置', 'income', 'secondhand', TRUE, 34),('其他收入', 'income', 'other', TRUE, 99);

INSERT INTO bill_types (name, description, icon, is_system, sort_order) VALUES
('日常消费', '餐饮、购物、交通等日常开销', 'daily', TRUE, 1),('固定支出', '房租、水电、话费等周期性支出', 'fixed', TRUE, 2),('人情往来', '红包、礼金、请客等社交支出', 'social', TRUE, 3),('网购', '淘宝、京东、拼多多等网购消费', 'online', TRUE, 4),('线下消费', '超市、商场、门店等线下消费', 'offline', TRUE, 5),('餐饮外卖', '美团、饿了么等外卖消费', 'takeaway', TRUE, 6),('出行交通', '打车、公交、加油等出行费用', 'transport', TRUE, 7),('医疗健康', '看病、买药、体检等医疗支出', 'medical', TRUE, 8),('教育培训', '学费、课程、书籍等教育支出', 'education', TRUE, 9),('娱乐休闲', '电影、游戏、旅游等娱乐消费', 'entertainment', TRUE, 10),('投资理财', '基金、股票、存款等投资类', 'invest', TRUE, 11),('工资收入', '工资、奖金等劳动收入', 'salary', TRUE, 12),('副业收入', '兼职、外包、稿费等额外收入', 'sidejob', TRUE, 13),('转账', '账户间转账、借还款等', 'transfer', TRUE, 14),('其他', '其他类型', 'other', TRUE, 99);
SQLEOF

# 拉取并启动
echo ""
echo "[3/4] 拉取镜像..."
docker-compose -f docker-compose.cloud.yml pull

echo ""
echo "[4/4] 启动服务..."
docker-compose -f docker-compose.cloud.yml up -d

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "访问地址: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "后续更新命令:"
echo "  cd /opt/family-accounting"
echo "  docker-compose -f docker-compose.cloud.yml pull"
echo "  docker-compose -f docker-compose.cloud.yml up -d"
