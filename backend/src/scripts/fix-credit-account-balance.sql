-- ============================================================
-- 修复信用卡账户余额问题
-- 问题描述：创建信用卡账户时，用户可能误将信用额度填入初始余额
--          导致信用卡的 balance 字段被错误设置为正数（如信用额度值）
--          这会导致家庭资产统计时，将信用额度计入总资产
-- 
-- 修复方案：将所有信用卡账户的 balance 重置为 0
--          因为信用卡的"余额"应该通过交易记录计算（消费-还款）
--          而不是手动设置
-- 
-- 执行时间：2026-01-15
-- ============================================================

-- 1. 先查看受影响的数据（预览，不执行修改）
SELECT 
    id,
    user_id,
    name,
    type,
    balance,
    credit_limit,
    created_at
FROM accounts 
WHERE type = 'credit' AND balance > 0;

-- 2. 备份受影响的数据（可选，建议执行）
-- CREATE TABLE accounts_credit_backup_20260115 AS
-- SELECT * FROM accounts WHERE type = 'credit' AND balance > 0;

-- 3. 执行修复：将信用卡账户的 balance 重置为 0
UPDATE accounts 
SET balance = 0 
WHERE type = 'credit' AND balance > 0;

-- 4. 验证修复结果
SELECT 
    id,
    user_id,
    name,
    type,
    balance,
    credit_limit
FROM accounts 
WHERE type = 'credit';

-- ============================================================
-- 注意事项：
-- 1. 执行前请先备份数据库
-- 2. 建议先在测试环境验证
-- 3. 如果用户确实有信用卡还款超额的情况（balance 应为正数），
--    需要单独处理这些特殊情况
-- ============================================================
