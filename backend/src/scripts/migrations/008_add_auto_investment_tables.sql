-- 定投计划表
CREATE TABLE IF NOT EXISTS auto_investment_plans (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL COMMENT '计划名称',
  source_account_id INT UNSIGNED NOT NULL COMMENT '资金来源账户',
  target_account_id INT UNSIGNED NOT NULL COMMENT '目标投资账户',
  amount DECIMAL(15, 2) NOT NULL COMMENT '定投金额',
  frequency ENUM('daily', 'weekly', 'monthly') NOT NULL COMMENT '执行频率',
  execution_day TINYINT NULL COMMENT '执行日（周几1-7或月几1-31）',
  execution_time VARCHAR(5) NOT NULL DEFAULT '09:00' COMMENT '执行时间 HH:mm',
  status ENUM('active', 'paused', 'deleted') NOT NULL DEFAULT 'active' COMMENT '状态',
  next_execution_date DATE NOT NULL COMMENT '下次执行日期',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (target_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status),
  INDEX idx_next_execution (next_execution_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 执行记录表
CREATE TABLE IF NOT EXISTS execution_records (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_id INT UNSIGNED NULL COMMENT '关联的定投计划（单次买入为null）',
  user_id INT UNSIGNED NOT NULL,
  source_account_id INT UNSIGNED NOT NULL COMMENT '资金来源账户',
  target_account_id INT UNSIGNED NOT NULL COMMENT '目标投资账户',
  paid_amount DECIMAL(15, 2) NOT NULL COMMENT '实际支付金额',
  invested_amount DECIMAL(15, 2) NOT NULL COMMENT '获得的投资金额',
  discount_rate DECIMAL(5, 4) NOT NULL DEFAULT 1.0000 COMMENT '折扣率',
  shares DECIMAL(15, 4) NOT NULL COMMENT '买入份额',
  net_value DECIMAL(15, 4) NOT NULL COMMENT '买入时净值',
  status ENUM('success', 'failed') NOT NULL COMMENT '执行状态',
  fail_reason VARCHAR(255) NULL COMMENT '失败原因',
  executed_at TIMESTAMP NOT NULL COMMENT '执行时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (plan_id) REFERENCES auto_investment_plans(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (target_account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_user_executed (user_id, executed_at),
  INDEX idx_plan_executed (plan_id, executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 投资提醒表
CREATE TABLE IF NOT EXISTS investment_reminders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  plan_id INT UNSIGNED NOT NULL,
  type ENUM('execution_failed', 'insufficient_balance') NOT NULL COMMENT '提醒类型',
  message VARCHAR(500) NOT NULL COMMENT '提醒消息',
  is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已读',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES auto_investment_plans(id) ON DELETE CASCADE,
  INDEX idx_user_unread (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
