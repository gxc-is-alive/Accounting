-- 迁移脚本：移除账单类型功能
-- 执行前请备份数据库

-- 1. 移除 transactions 表的 bill_type_id 外键约束
ALTER TABLE transactions DROP FOREIGN KEY transactions_ibfk_5;

-- 2. 移除 bill_type_id 列
ALTER TABLE transactions DROP COLUMN bill_type_id;

-- 3. 删除 bill_types 表
DROP TABLE IF EXISTS bill_types;
