import sequelize from "../config/database";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  try {
    console.log("连接数据库...");
    await sequelize.authenticate();
    console.log("数据库连接成功");

    // 读取迁移 SQL 文件
    const migrationPath = path.join(
      __dirname,
      "migrations/008_add_auto_investment_tables.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    // 分割 SQL 语句（按分号分割，但忽略注释中的分号）
    const statements = sql
      .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`准备执行 ${statements.length} 条 SQL 语句...`);

    for (const statement of statements) {
      try {
        const preview = statement.substring(0, 80).replace(/\n/g, " ");
        console.log(`执行: ${preview}...`);
        await sequelize.query(statement);
        console.log("✓ 成功");
      } catch (error: any) {
        // 忽略"表已存在"的错误
        if (
          error.message.includes("already exists") ||
          error.message.includes("Duplicate")
        ) {
          console.log(`⚠ 跳过 (已存在)`);
        } else {
          console.log(`⚠ 警告: ${error.message}`);
        }
      }
    }

    console.log("\n定投功能迁移完成!");
    process.exit(0);
  } catch (error) {
    console.error("迁移失败:", error);
    process.exit(1);
  }
}

runMigration();
