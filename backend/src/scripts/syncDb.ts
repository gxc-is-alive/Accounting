import sequelize from "../config/database";

// 导入所有模型（会自动初始化关联）
import "../models";

const syncDatabase = async () => {
  try {
    console.log("开始同步数据库...");

    // 同步所有模型到数据库
    await sequelize.sync({ alter: true });

    console.log("数据库同步完成！");
    process.exit(0);
  } catch (error) {
    console.error("数据库同步失败:", error);
    process.exit(1);
  }
};

syncDatabase();
