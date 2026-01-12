-- 创建数据库
CREATE DATABASE IF NOT EXISTS family_accounting
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE family_accounting;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 家庭表
CREATE TABLE IF NOT EXISTS families (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 家庭成员表
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

-- 家庭邀请码表
CREATE TABLE IF NOT EXISTS family_invites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
);

-- 账户表
CREATE TABLE IF NOT EXISTS accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('cash', 'bank', 'alipay', 'wechat', 'credit', 'other') NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0,
    icon VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 分类表
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
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_system (is_system)
);

-- 账单类型表
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_system (is_system)
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    family_id INT,
    account_id INT NOT NULL,
    category_id INT NOT NULL,
    bill_type_id INT NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    date DATE NOT NULL,
    note VARCHAR(500),
    is_family BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (bill_type_id) REFERENCES bill_types(id),
    INDEX idx_user_date (user_id, date),
    INDEX idx_family_date (family_id, date)
);

-- 预算表
CREATE TABLE IF NOT EXISTS budgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT,
    amount DECIMAL(15, 2) NOT NULL,
    month VARCHAR(7) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category_month (user_id, category_id, month)
);

-- Token 黑名单表（用于退出登录）
CREATE TABLE IF NOT EXISTS token_blacklist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(500) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token(255)),
    INDEX idx_expires (expires_at)
);

-- 插入系统预设分类
INSERT INTO categories (name, type, icon, is_system, sort_order) VALUES
('餐饮', 'expense', 'food', TRUE, 1),
('交通', 'expense', 'car', TRUE, 2),
('购物', 'expense', 'shopping', TRUE, 3),
('娱乐', 'expense', 'game', TRUE, 4),
('居住', 'expense', 'home', TRUE, 5),
('医疗', 'expense', 'medical', TRUE, 6),
('教育', 'expense', 'book', TRUE, 7),
('通讯', 'expense', 'phone', TRUE, 8),
('人情', 'expense', 'gift', TRUE, 9),
('其他支出', 'expense', 'other', TRUE, 99),
('工资', 'income', 'salary', TRUE, 1),
('奖金', 'income', 'bonus', TRUE, 2),
('投资收益', 'income', 'invest', TRUE, 3),
('兼职', 'income', 'parttime', TRUE, 4),
('红包', 'income', 'redpacket', TRUE, 5),
('其他收入', 'income', 'other', TRUE, 99);

-- 插入系统预设账单类型
INSERT INTO bill_types (name, description, icon, is_system, sort_order) VALUES
('日常消费', '餐饮、购物、交通等日常开销', 'daily', TRUE, 1),
('固定支出', '房租、水电、话费等周期性支出', 'fixed', TRUE, 2),
('人情往来', '红包、礼金、请客等社交支出', 'social', TRUE, 3),
('投资理财', '基金、股票、存款等投资类', 'invest', TRUE, 4),
('工资收入', '工资、奖金等劳动收入', 'salary', TRUE, 5),
('其他', '其他类型', 'other', TRUE, 99);
