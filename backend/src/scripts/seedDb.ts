import sequelize from "../config/database";

// 系统预设分类数据
const systemCategories = [
  // 支出分类
  { name: "餐饮", type: "expense", icon: "food", isSystem: true },
  { name: "交通", type: "expense", icon: "car", isSystem: true },
  { name: "购物", type: "expense", icon: "shopping", isSystem: true },
  { name: "娱乐", type: "expense", icon: "game", isSystem: true },
  { name: "居住", type: "expense", icon: "home", isSystem: true },
  { name: "医疗", type: "expense", icon: "medical", isSystem: true },
  { name: "教育", type: "expense", icon: "book", isSystem: true },
  { name: "通讯", type: "expense", icon: "phone", isSystem: true },
  // 收入分类
  { name: "工资", type: "income", icon: "wallet", isSystem: true },
  { name: "奖金", type: "income", icon: "gift", isSystem: true },
  { name: "投资收益", type: "income", icon: "chart", isSystem: true },
  { name: "兼职", type: "income", icon: "work", isSystem: true },
  { name: "其他收入", type: "income", icon: "other", isSystem: true },
];

const seedDatabase = async () => {
  try {
    console.log("开始初始化种子数据...");

    // 确保数据库连接
    await sequelize.authenticate();

    // TODO: 创建系统分类
    // const existingCategories = await Category.count({ where: { isSystem: true } });
    // if (existingCategories === 0) {
    //   await Category.bulkCreate(systemCategories);
    //   console.log('系统分类创建完成');
    // }

    console.log("种子数据初始化完成！");
    console.log("预设分类:", systemCategories.length);

    process.exit(0);
  } catch (error) {
    console.error("种子数据初始化失败:", error);
    process.exit(1);
  }
};

seedDatabase();

export { systemCategories };
