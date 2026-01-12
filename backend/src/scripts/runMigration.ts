import sequelize from "../config/database";

async function runMigration() {
  try {
    console.log("连接数据库...");
    await sequelize.authenticate();
    console.log("数据库连接成功");

    const statements = [
      // 1. 添加 credit_limit 字段
      `ALTER TABLE accounts ADD COLUMN credit_limit DECIMAL(15, 2) DEFAULT NULL COMMENT '信用额度'`,
      // 2. 添加 billing_day 字段
      `ALTER TABLE accounts ADD COLUMN billing_day TINYINT DEFAULT NULL COMMENT '账单日 (1-28)'`,
      // 3. 添加 due_day 字段
      `ALTER TABLE accounts ADD COLUMN due_day TINYINT DEFAULT NULL COMMENT '还款日 (1-28)'`,
      // 4. 修改 transactions 表的 type 枚举
      `ALTER TABLE transactions MODIFY COLUMN type ENUM('income', 'expense', 'repayment') NOT NULL`,
      // 5. 添加 source_account_id 字段
      `ALTER TABLE transactions ADD COLUMN source_account_id INT UNSIGNED DEFAULT NULL COMMENT '还款来源账户ID'`,
    ];

    console.log(`准备执行 ${statements.length} 条 SQL 语句...`);

    for (const statement of statements) {
      try {
        console.log(`执行: ${statement.substring(0, 80)}...`);
        await sequelize.query(statement);
        console.log("✓ 成功");
      } catch (error: any) {
        // 忽略"列已存在"的错误
        if (
          error.message.includes("Duplicate column") ||
          error.message.includes("Duplicate key name") ||
          error.message.includes("already exists")
        ) {
          console.log(`⚠ 跳过 (已存在)`);
        } else {
          console.log(`⚠ 警告: ${error.message}`);
        }
      }
    }

    console.log("\n迁移完成!");
    process.exit(0);
  } catch (error) {
    console.error("迁移失败:", error);
    process.exit(1);
  }
}

runMigration();
