import { Op } from "sequelize";
import { BillType } from "../models";
import { AppError, ErrorCode } from "../utils/errors";

interface CreateBillTypeData {
  userId: number;
  name: string;
  description?: string;
  icon?: string;
}

interface UpdateBillTypeData {
  name?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

class BillTypeService {
  // 获取用户可见的所有账单类型（系统预设 + 用户自定义）
  async getByUserId(userId: number) {
    return BillType.findAll({
      where: {
        [Op.or]: [{ userId: null, isSystem: true }, { userId }],
      },
      order: [
        ["isSystem", "DESC"],
        ["sortOrder", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
  }

  // 获取单个账单类型
  async getById(id: number, userId: number) {
    const billType = await BillType.findOne({
      where: {
        id,
        [Op.or]: [{ userId: null, isSystem: true }, { userId }],
      },
    });

    if (!billType) {
      throw new AppError("账单类型不存在", 404, ErrorCode.NOT_FOUND);
    }

    return billType;
  }

  // 创建自定义账单类型
  async create(data: CreateBillTypeData) {
    // 检查同名账单类型
    const existing = await BillType.findOne({
      where: {
        name: data.name,
        [Op.or]: [{ userId: null, isSystem: true }, { userId: data.userId }],
      },
    });

    if (existing) {
      throw new AppError("已存在同名账单类型", 400, ErrorCode.DUPLICATE_ENTRY);
    }

    return BillType.create({
      userId: data.userId,
      name: data.name,
      description: data.description || "",
      icon: data.icon || "default",
      isSystem: false,
    });
  }

  // 更新账单类型
  async update(id: number, userId: number, data: UpdateBillTypeData) {
    const billType = await BillType.findOne({
      where: { id, userId, isSystem: false },
    });

    if (!billType) {
      throw new AppError("账单类型不存在或无权修改", 404, ErrorCode.NOT_FOUND);
    }

    // 检查同名
    if (data.name && data.name !== billType.name) {
      const existing = await BillType.findOne({
        where: {
          name: data.name,
          id: { [Op.ne]: id },
          [Op.or]: [{ userId: null, isSystem: true }, { userId }],
        },
      });

      if (existing) {
        throw new AppError(
          "已存在同名账单类型",
          400,
          ErrorCode.DUPLICATE_ENTRY
        );
      }
    }

    await billType.update(data);
    return billType;
  }

  // 删除账单类型
  async delete(id: number, userId: number) {
    const billType = await BillType.findOne({
      where: { id, userId, isSystem: false },
    });

    if (!billType) {
      throw new AppError("账单类型不存在或无权删除", 404, ErrorCode.NOT_FOUND);
    }

    // TODO: 检查是否有关联的交易记录

    await billType.destroy();
  }

  // 创建系统预设账单类型（种子数据用）
  async createSystemBillTypes() {
    const systemBillTypes = [
      {
        name: "日常消费",
        description: "日常生活开支",
        icon: "daily",
        sortOrder: 1,
      },
      {
        name: "固定支出",
        description: "房租、水电等固定支出",
        icon: "fixed",
        sortOrder: 2,
      },
      {
        name: "人情往来",
        description: "礼金、红包等",
        icon: "social",
        sortOrder: 3,
      },
      {
        name: "投资理财",
        description: "投资、理财相关",
        icon: "invest",
        sortOrder: 4,
      },
      {
        name: "工资收入",
        description: "工资、奖金等",
        icon: "salary",
        sortOrder: 5,
      },
      { name: "其他", description: "其他类型", icon: "other", sortOrder: 99 },
    ];

    for (const bt of systemBillTypes) {
      await BillType.findOrCreate({
        where: { name: bt.name, isSystem: true },
        defaults: { ...bt, userId: null, isSystem: true },
      });
    }
  }
}

export default new BillTypeService();
