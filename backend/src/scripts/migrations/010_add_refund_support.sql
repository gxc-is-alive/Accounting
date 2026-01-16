-- 迁移脚本：添加退款功能支持
-- 版本: 010
-- 描述: 扩展 transactions 表以支持退款功能，添加原交易关联字段

USE family_accounting;

-- 1. 扩展 transactions 表，支持退款类型
-- 修改 type 枚举，添加 'refund' 类型
ALTER TABLE transactions
  MODIFY COLUMN type ENUM('income', 'expense', 'repayment', 'refund') NOT NULL;

-- 2. 添加原交易关联字段
ALTER TABLE transactions
  ADD COLUMN original_transaction_id INT UNSIGNED DEFAULT NULL COMMENT '退款关联的原始交易ID';

-- 3. 添加外键约束，设置级联删除（原交易删除时，关联的退款记录也删除）
ALTER TABLE transactions
  ADD CONSTRAINT fk_original_transaction 
    FOREIGN KEY (original_transaction_id) 
    REFERENCES transactions(id) 
    ON DELETE CASCADE;

-- 4. 添加索引优化查询
ALTER TABLE transactions
  ADD INDEX idx_original_transaction (original_transaction_id);

-- 5. 添加退款分类（如果不存在）
INSERT INTO categories (name, type, icon, is_system, sort_order)
SELECT '退款', 'income', 'refund', TRUE, 11
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '退款' AND is_system = TRUE);
