import mysql from "mysql2/promise";

async function checkData() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root123",
    database: "family_accounting",
  });

  try {
    // 查询账户
    console.log("=== 账户信息 ===");
    const [accounts] = await connection.execute(
      "SELECT id, name, type, balance, credit_limit FROM accounts"
    );
    console.table(accounts);

    // 查询交易记录
    console.log("\n=== 最近交易记录 ===");
    const [transactions] = await connection.execute(
      "SELECT id, type, amount, account_id, source_account_id, note, date FROM transactions ORDER BY id DESC LIMIT 10"
    );
    console.table(transactions);
  } finally {
    await connection.end();
  }
}

checkData().catch(console.error);
