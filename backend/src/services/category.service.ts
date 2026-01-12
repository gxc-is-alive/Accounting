import { Op } from "sequelize";
import { Category } from "../models";
import { CategoryType } from "../models/Category";
import { AppError, ErrorCode } from "../utils/errors";

interface CreateCategoryData {
  userId: number;
  name: string;
  type: CategoryType;
  icon?: string;
  parentId?: number;
}

interface UpdateCategoryData {
  name?: string;
  icon?: string;
  parentId?: number | null;
  sortOrder?: number;
}

class CategoryService {
  // 获取用户可见的所有分类（系统分类 + 用户自定义分类）
  async getByUserId(userId: number, type?: CategoryType) {
    const where: any = {
      [Op.or]: [{ userId: null, isSystem: true }, { userId }],
    };

    if (type) {
      where.type = type;
    }

    return Category.findAll({
      where,
      order: [
        ["isSystem", "DESC"],
        ["sortOrder", "ASC"],
        ["createdAt", "ASC"],
      ],
      include: [
        {
          model: Category,
          as: "children",
          required: false,
        },
      ],
    });
  }

  // 获取单个分类
  async getById(id: number, userId: number) {
    const category = await Category.findOne({
      where: {
        id,
        [Op.or]: [{ userId: null, isSystem: true }, { userId }],
      },
    });

    if (!category) {
      throw new AppError("分类不存在", 404, ErrorCode.NOT_FOUND);
    }

    return category;
  }

  // 创建自定义分类
  async create(data: CreateCategoryData) {
    // 检查同名分类
    const existing = await Category.findOne({
      where: {
        name: data.name,
        type: data.type,
        [Op.or]: [{ userId: null, isSystem: true }, { userId: data.userId }],
      },
    });

    if (existing) {
      throw new AppError(
        "同类型下已存在同名分类",
        400,
        ErrorCode.DUPLICATE_ENTRY
      );
    }

    // 如果有父分类，验证父分类存在且类型一致
    if (data.parentId) {
      const parent = await Category.findByPk(data.parentId);
      if (!parent) {
        throw new AppError("父分类不存在", 400, ErrorCode.VALIDATION_ERROR);
      }
      if (parent.type !== data.type) {
        throw new AppError(
          "子分类类型必须与父分类一致",
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }
    }

    return Category.create({
      userId: data.userId,
      name: data.name,
      type: data.type,
      icon: data.icon || "default",
      parentId: data.parentId || null,
      isSystem: false,
    });
  }

  // 更新分类
  async update(id: number, userId: number, data: UpdateCategoryData) {
    const category = await Category.findOne({
      where: { id, userId, isSystem: false },
    });

    if (!category) {
      throw new AppError("分类不存在或无权修改", 404, ErrorCode.NOT_FOUND);
    }

    // 检查同名分类
    if (data.name && data.name !== category.name) {
      const existing = await Category.findOne({
        where: {
          name: data.name,
          type: category.type,
          id: { [Op.ne]: id },
          [Op.or]: [{ userId: null, isSystem: true }, { userId }],
        },
      });

      if (existing) {
        throw new AppError(
          "同类型下已存在同名分类",
          400,
          ErrorCode.DUPLICATE_ENTRY
        );
      }
    }

    await category.update(data);
    return category;
  }

  // 删除分类
  async delete(id: number, userId: number) {
    const category = await Category.findOne({
      where: { id, userId, isSystem: false },
    });

    if (!category) {
      throw new AppError("分类不存在或无权删除", 404, ErrorCode.NOT_FOUND);
    }

    // 检查是否有子分类
    const childCount = await Category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new AppError("请先删除子分类", 400, ErrorCode.VALIDATION_ERROR);
    }

    // TODO: 检查是否有关联的交易记录

    await category.destroy();
  }

  // 创建系统预设分类（种子数据用）
  async createSystemCategories() {
    const systemCategories = [
      // 支出分类
      {
        name: "餐饮",
        type: "expense" as CategoryType,
        icon: "food",
        sortOrder: 1,
      },
      {
        name: "交通",
        type: "expense" as CategoryType,
        icon: "car",
        sortOrder: 2,
      },
      {
        name: "购物",
        type: "expense" as CategoryType,
        icon: "shopping",
        sortOrder: 3,
      },
      {
        name: "娱乐",
        type: "expense" as CategoryType,
        icon: "game",
        sortOrder: 4,
      },
      {
        name: "居住",
        type: "expense" as CategoryType,
        icon: "home",
        sortOrder: 5,
      },
      {
        name: "医疗",
        type: "expense" as CategoryType,
        icon: "medical",
        sortOrder: 6,
      },
      {
        name: "教育",
        type: "expense" as CategoryType,
        icon: "book",
        sortOrder: 7,
      },
      {
        name: "通讯",
        type: "expense" as CategoryType,
        icon: "phone",
        sortOrder: 8,
      },
      {
        name: "人情",
        type: "expense" as CategoryType,
        icon: "gift",
        sortOrder: 9,
      },
      {
        name: "其他支出",
        type: "expense" as CategoryType,
        icon: "other",
        sortOrder: 99,
      },
      // 收入分类
      {
        name: "工资",
        type: "income" as CategoryType,
        icon: "salary",
        sortOrder: 1,
      },
      {
        name: "奖金",
        type: "income" as CategoryType,
        icon: "bonus",
        sortOrder: 2,
      },
      {
        name: "投资收益",
        type: "income" as CategoryType,
        icon: "invest",
        sortOrder: 3,
      },
      {
        name: "兼职",
        type: "income" as CategoryType,
        icon: "parttime",
        sortOrder: 4,
      },
      {
        name: "红包",
        type: "income" as CategoryType,
        icon: "redpacket",
        sortOrder: 5,
      },
      {
        name: "其他收入",
        type: "income" as CategoryType,
        icon: "other",
        sortOrder: 99,
      },
    ];

    for (const cat of systemCategories) {
      await Category.findOrCreate({
        where: { name: cat.name, type: cat.type, isSystem: true },
        defaults: { ...cat, userId: null, isSystem: true },
      });
    }
  }
}

export default new CategoryService();
