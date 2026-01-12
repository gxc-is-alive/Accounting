-- 迁移脚本：添加信用账户支持
-- 版本: 001
-- 描述: 扩展 accounts 和 transactions 表以支持信用账户和还款功能

USE family_accounting;

-- 1. 扩展 accounts 表，添加信用账户字段
ALTER TABLE accounts
  ADD COLUMN credit_limit DECIMAL(15, 2) DEFAULT NULL COMMENT '信用额度',
  ADD COLUMN billing_day TINYINT DEFAULT NULL COMMENT '账单日 (1-28)',
  ADD COLUMN due_day TINYINT DEFAULT NULL COMMENT '还款日 (1-28)';

-- 添加约束确保账单日和还款日在有效范围内
ALTER TABLE accounts
  ADD CONSTRAINT chk_billing_day CHECK (billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 28)),
  ADD CONSTRAINT chk_due_day CHECK (due_day IS NULL OR (due_day >= 1 AND due_day <= 28));

-- 2. 扩展 transactions 表，支持还款类型
-- 修改 type 枚举，添加 'repayment' 类型
ALTER TABLE transactions
  MODIFY COLUMN type ENUM('income', 'expense', 'repayment') NOT NULL;

-- 添加还款来源账户字段
ALTER TABLE transactions
  ADD COLUMN source_account_id INT UNSIGNED DEFAULT NULL COMMENT '还款来源账户ID',
  ADD CONSTRAINT fk_source_account FOREIGN KEY (source_account_id) REFERENCES accounts(id) ON DELETE SET NULL;

-- 添加索引优化查询
ALTER TABLE transactions
  ADD INDEX idx_type (type),
  ADD INDEX idx_source_account (source_account_id);

-- 3. 添加还款分类（如果不存在）
INSERT INTO categories (name, type, icon, is_system, sort_order)
SELECT '还款', 'expense', 'credit-card', TRUE, 10
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '还款' AND is_system = TRUE);
