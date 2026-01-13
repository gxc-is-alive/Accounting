/**
 * 数据库迁移服务
 * 自动管理和执行数据库迁移
 */

import sequelize from "../config/database";
import { QueryTypes } from "sequelize";

// 当前数据库版本
const CURRENT_VERSION = 8;

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
