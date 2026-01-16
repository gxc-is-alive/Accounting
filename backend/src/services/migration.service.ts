/**
 * 数据库迁移服务
 * 自动管理和执行数据库迁移
 */

import sequelize from "../config/database";
import { QueryTypes } from "sequelize";

// 当前数据库版本
const CURRENT_VERSION = 12;

// 迁移定义
interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
}

class MigrationService {
  /**
   * 获取数据库当前版本
   */
  async getCurrentVersion(): Promise<number> {
    try {
      // 检查版本表是否存在
      const [tables] = await sequelize.query("SHOW TABLES LIKE 'db_version'", {
        type: QueryTypes.RAW,
      });

      if (!Array.isArray(tables) || tables.length === 0) {
        // 创建版本表
        await sequelize.query(`
          CREATE TABLE db_version (
            id INT PRIMARY KEY DEFAULT 1,
            version INT NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        await sequelize.query(
          "INSERT INTO db_version (id, version) VALUES (1, 0)"
        );
        return 0;
      }

      const [result] = await sequelize.query<{ version: number }>(
        "SELECT version FROM db_version WHERE id = 1",
        { type: QueryTypes.SELECT }
      );

      return result?.version || 0;
    } catch (error) {
      console.error("获取数据库版本失败:", error);
      return 0;
    }
  }

  /**
   * 更新数据库版本
   */
  private async setVersion(version: number): Promise<void> {
    await sequelize.query("UPDATE db_version SET version = ? WHERE id = 1", {
      replacements: [version],
    });
  }

  /**
   * 检查列是否存在
   */
  private async columnExists(table: string, column: string): Promise<boolean> {
    const [columns] = await sequelize.query(
      `SHOW COLUMNS FROM ${table} LIKE '${column}'`,
      { type: QueryTypes.RAW }
    );
    return Array.isArray(columns) && columns.length > 0;
  }

  /**
   * 检查表是否存在
   */
  private async tableExists(table: string): Promise<boolean> {
    const [tables] = await sequelize.query(`SHOW TABLES LIKE '${table}'`, {
      type: QueryTypes.RAW,
    });
    return Array.isArray(tables) && tables.length > 0;
  }

  /**
   * 定义所有迁移
   */
  private getMigrations(): Migration[] {
    return [
      {
        version: 1,
        name: "添加信用卡账户字段",
        up: async () => {
          // 检查并添加 credit_limit 列
          if (!(await this.columnExists("accounts", "credit_limit"))) {
            await sequelize.query(
              "ALTER TABLE accounts ADD COLUMN credit_limit DECIMAL(15, 2)"
            );
          }
          // 检查并添加 billing_day 列
          if (!(await this.columnExists("accounts", "billing_day"))) {
            await sequelize.query(
              "ALTER TABLE accounts ADD COLUMN billing_day TINYINT"
            );
          }
          // 检查并添加 due_day 列
          if (!(await this.columnExists("accounts", "due_day"))) {
            await sequelize.query(
              "ALTER TABLE accounts ADD COLUMN due_day TINYINT"
            );
          }
        },
      },
      {
        version: 2,
        name: "添加附件表",
        up: async () => {
          if (!(await this.tableExists("attachments"))) {
            await sequelize.query(`
              CREATE TABLE attachments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                transaction_id INT NOT NULL,
                user_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                size INT NOT NULL,
                storage_path VARCHAR(500) NOT NULL,
                thumbnail_path VARCHAR(500),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_transaction_id (transaction_id),
                INDEX idx_user_id (user_id)
              )
            `);
          }
        },
      },
      {
        version: 7,
        name: "移除账单类型功能",
        up: async () => {
          // 1. 移除 transactions 表的 bill_type_id 列（如果存在）
          if (await this.columnExists("transactions", "bill_type_id")) {
            // 先尝试删除外键约束
            try {
              await sequelize.query(
                "ALTER TABLE transactions DROP FOREIGN KEY transactions_ibfk_5"
              );
            } catch (e) {
              // 外键可能不存在，忽略错误
            }
            // 删除列
            await sequelize.query(
              "ALTER TABLE transactions DROP COLUMN bill_type_id"
            );
          }

          // 2. 删除 bill_types 表（如果存在）
          if (await this.tableExists("bill_types")) {
            await sequelize.query("DROP TABLE bill_types");
          }
        },
      },
      {
        version: 8,
        name: "添加投资追踪功能",
        up: async () => {
          // 1. 扩展 accounts 表的 type 枚举，新增 'investment'
          // MySQL 需要重新定义 ENUM 类型
          await sequelize.query(`
            ALTER TABLE accounts MODIFY COLUMN type 
            ENUM('cash', 'bank', 'alipay', 'wechat', 'credit', 'investment', 'other') NOT NULL
          `);

          // 2. 添加投资账户扩展字段
          if (!(await this.columnExists("accounts", "shares"))) {
            await sequelize.query(
              "ALTER TABLE accounts ADD COLUMN shares DECIMAL(15, 4)"
            );
          }
          if (!(await this.columnExists("accounts", "cost_price"))) {
            await sequelize.query(
              "ALTER TABLE accounts ADD COLUMN cost_price DECIMAL(15, 4)"
            );
          }
          if (!(await this.columnExists("accounts", "current_net_value"))) {
            await sequelize.query(
              "ALTER TABLE accounts ADD COLUMN current_net_value DECIMAL(15, 4)"
            );
          }

          // 3. 创建估值记录表
          if (!(await this.tableExists("valuations"))) {
            await sequelize.query(`
              CREATE TABLE valuations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                account_id INT NOT NULL,
                net_value DECIMAL(15, 4) NOT NULL,
                market_value DECIMAL(15, 2) NOT NULL,
                date DATE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
                UNIQUE KEY unique_account_date (account_id, date),
                INDEX idx_account_date (account_id, date)
              )
            `);
          }
        },
      },
      {
        version: 9,
        name: "添加定投功能",
        up: async () => {
          // 1. 创建定投计划表
          if (!(await this.tableExists("auto_investment_plans"))) {
            await sequelize.query(`
              CREATE TABLE auto_investment_plans (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL,
                name VARCHAR(100) NOT NULL COMMENT '计划名称',
                source_account_id INT UNSIGNED NOT NULL COMMENT '资金来源账户',
                target_account_id INT UNSIGNED NOT NULL COMMENT '目标账户',
                amount DECIMAL(15, 2) NOT NULL COMMENT '定投金额',
                frequency ENUM('daily', 'weekly', 'monthly') NOT NULL COMMENT '执行频率',
                execution_day TINYINT NULL COMMENT '执行日（周几1-7或月几1-31）',
                execution_time VARCHAR(5) NOT NULL DEFAULT '09:00' COMMENT '执行时间 HH:mm',
                status ENUM('active', 'paused', 'deleted') NOT NULL DEFAULT 'active' COMMENT '状态',
                next_execution_date DATE NOT NULL COMMENT '下次执行日期',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_status (user_id, status),
                INDEX idx_next_execution (next_execution_date, status)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
          }

          // 2. 创建执行记录表
          if (!(await this.tableExists("execution_records"))) {
            await sequelize.query(`
              CREATE TABLE execution_records (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                plan_id INT UNSIGNED NULL COMMENT '关联的定投计划（单次买入为null）',
                user_id INT UNSIGNED NOT NULL,
                source_account_id INT UNSIGNED NOT NULL COMMENT '资金来源账户',
                target_account_id INT UNSIGNED NOT NULL COMMENT '目标账户',
                paid_amount DECIMAL(15, 2) NOT NULL COMMENT '实际支付金额',
                invested_amount DECIMAL(15, 2) NOT NULL COMMENT '获得的金额',
                discount_rate DECIMAL(5, 4) NOT NULL DEFAULT 1.0000 COMMENT '折扣率',
                shares DECIMAL(15, 4) NOT NULL COMMENT '买入份额',
                net_value DECIMAL(15, 4) NOT NULL COMMENT '买入时净值',
                status ENUM('success', 'failed') NOT NULL COMMENT '执行状态',
                fail_reason VARCHAR(255) NULL COMMENT '失败原因',
                executed_at TIMESTAMP NOT NULL COMMENT '执行时间',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_executed (user_id, executed_at),
                INDEX idx_plan_executed (plan_id, executed_at)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
          }

          // 3. 创建投资提醒表
          if (!(await this.tableExists("investment_reminders"))) {
            await sequelize.query(`
              CREATE TABLE investment_reminders (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL,
                plan_id INT UNSIGNED NOT NULL,
                type ENUM('execution_failed', 'insufficient_balance') NOT NULL COMMENT '提醒类型',
                message VARCHAR(500) NOT NULL COMMENT '提醒消息',
                is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已读',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_unread (user_id, is_read)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
          }
        },
      },
      {
        version: 10,
        name: "添加快速平账功能",
        up: async () => {
          // 创建余额调整记录表
          if (!(await this.tableExists("balance_adjustments"))) {
            await sequelize.query(`
              CREATE TABLE balance_adjustments (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL,
                account_id INT UNSIGNED NOT NULL,
                previous_balance DECIMAL(15, 2) NOT NULL COMMENT '调整前余额',
                new_balance DECIMAL(15, 2) NOT NULL COMMENT '调整后余额',
                difference DECIMAL(15, 2) NOT NULL COMMENT '差额',
                note VARCHAR(255) NULL COMMENT '备注',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_account_id (account_id),
                INDEX idx_created_at (created_at)
              ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
          }
        },
      },
      {
        version: 11,
        name: "修复信用卡账户余额",
        up: async () => {
          // 修复：将所有信用卡账户的正余额重置为0
          // 问题原因：创建信用卡时用户可能误将信用额度填入初始余额
          await sequelize.query(`
            UPDATE accounts SET balance = 0 WHERE type = 'credit' AND balance > 0
          `);
        },
      },
      {
        version: 12,
        name: "添加退款功能支持",
        up: async () => {
          // 1. 扩展 transactions 表的 type 枚举，添加 'refund' 类型
          await sequelize.query(`
            ALTER TABLE transactions MODIFY COLUMN type 
            ENUM('income', 'expense', 'repayment', 'refund') NOT NULL
          `);

          // 2. 添加原交易关联字段
          if (
            !(await this.columnExists(
              "transactions",
              "original_transaction_id"
            ))
          ) {
            await sequelize.query(`
              ALTER TABLE transactions 
              ADD COLUMN original_transaction_id INT UNSIGNED DEFAULT NULL 
              COMMENT '退款关联的原始交易ID'
            `);

            // 3. 添加外键约束，设置级联删除
            await sequelize.query(`
              ALTER TABLE transactions 
              ADD CONSTRAINT fk_original_transaction 
              FOREIGN KEY (original_transaction_id) 
              REFERENCES transactions(id) 
              ON DELETE CASCADE
            `);

            // 4. 添加索引优化查询
            await sequelize.query(`
              ALTER TABLE transactions 
              ADD INDEX idx_original_transaction (original_transaction_id)
            `);
          }

          // 5. 添加退款分类（如果不存在）
          const [existing] = await sequelize.query(
            "SELECT id FROM categories WHERE name = '退款' AND is_system = TRUE",
            { type: QueryTypes.SELECT }
          );
          if (!existing) {
            await sequelize.query(`
              INSERT INTO categories (name, type, icon, is_system, sort_order)
              VALUES ('退款', 'income', 'refund', TRUE, 11)
            `);
          }
        },
      },
    ];
  }

  /**
   * 执行迁移
   */
  async migrate(): Promise<{
    success: boolean;
    currentVersion: number;
    targetVersion: number;
    executed: string[];
    errors: string[];
  }> {
    const result = {
      success: true,
      currentVersion: 0,
      targetVersion: CURRENT_VERSION,
      executed: [] as string[],
      errors: [] as string[],
    };

    try {
      result.currentVersion = await this.getCurrentVersion();

      if (result.currentVersion >= CURRENT_VERSION) {
        return result;
      }

      const migrations = this.getMigrations()
        .filter((m) => m.version > result.currentVersion)
        .sort((a, b) => a.version - b.version);

      for (const migration of migrations) {
        try {
          console.log(`执行迁移 v${migration.version}: ${migration.name}`);
          await migration.up();
          await this.setVersion(migration.version);
          result.executed.push(`v${migration.version}: ${migration.name}`);
          console.log(`迁移 v${migration.version} 完成`);
        } catch (error) {
          const errMsg = `迁移 v${migration.version} 失败: ${
            (error as Error).message
          }`;
          console.error(errMsg);
          result.errors.push(errMsg);
          result.success = false;
          break;
        }
      }

      result.currentVersion = await this.getCurrentVersion();
    } catch (error) {
      result.success = false;
      result.errors.push(`迁移执行失败: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * 获取迁移状态
   */
  async getStatus(): Promise<{
    currentVersion: number;
    targetVersion: number;
    needsMigration: boolean;
    pendingMigrations: string[];
  }> {
    const currentVersion = await this.getCurrentVersion();
    const migrations = this.getMigrations()
      .filter((m) => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);

    return {
      currentVersion,
      targetVersion: CURRENT_VERSION,
      needsMigration: currentVersion < CURRENT_VERSION,
      pendingMigrations: migrations.map((m) => `v${m.version}: ${m.name}`),
    };
  }
}

export default new MigrationService();
