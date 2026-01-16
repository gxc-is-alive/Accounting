-- 迁移脚本：修复信用卡账户余额
-- 版本: 009
-- 描述: 将信用卡账户的错误余额重置为0
--       问题原因：创建信用卡时用户可能误将信用额度填入初始余额

USE family_accounting;

-- 修复：将所有信用卡账户的正余额重置为0
-- 信用卡的余额应该通过交易记录计算（消费-还款），而不是手动设置
UPDATE accounts 
SET balance = 0 
WHERE type = 'credit' AND balance > 0;
