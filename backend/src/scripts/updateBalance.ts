import mysql from "mysql2/promise";

async function updateBalance() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root123",
    database: "family_accounting",
  });

  try {
    // 更新现金钱包余额为 10000
    await connection.execute(
      "UPDATE accounts SET balance = 10000 WHERE name = '现金钱包'"
    );
    console.log("✅ 现金钱包余额已更新为 10000");

    // 查询更新后的结果
    const [rows] = await connection.execute(
      "SELECT id, name, balance FROM accounts WHERE name = '现金钱包'"
    );
    console.log("更新后的账户:", rows);
  } finally {
    await connection.end();
  }
}

updateBalance().catch(console.error);
