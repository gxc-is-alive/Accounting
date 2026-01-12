import { Op } from "sequelize";
import { Budget, Category, Transaction } from "../models";
import { AppError, ErrorCode } from "../utils/errors";

interface CreateBudgetData {
  userId: number;
  categoryId?: number;
  amount: number;
  month: string;
}

interface BudgetStatus {
  budgetId: number;
  categoryId: number | null;
  categoryName: string | null;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: "normal" | "warning" | "exceeded";
}

class BudgetService {
  // 获取用户某月的预算列表
  async getByMonth(userId: number, month: string) {
    const budgets = await Budget.findAll({
      where: { userId, month },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "icon"],
          required: false,
        },
      ],
      order: [["categoryId", "ASC"]],
    });

    return budgets;
  }

  // 创建或更新预算
  async upsert(data: CreateBudgetData) {
    // 如果有分类ID，验证分类存在
    if (data.categoryId) {
      const category = await Category.findOne({
        where: {
          id: data.categoryId,
          type: "expense", // 预算只针对支出分类
          [Op.or]: [{ userId: null, isSystem: true }, { userId: data.userId }],
        },
      });

      if (!category) {
        throw new AppError(
          "分类不存在或不是支出分类",
          404,
          ErrorCode.NOT_FOUND
        );
      }
    }

    // 查找是否已存在
    const existing = await Budget.findOne({
      where: {
        userId: data.userId,
        categoryId: data.categoryId || null,
        month: data.month,
      },
    });

    if (existing) {
      await existing.update({ amount: data.amount });
      return existing;
    }

    return Budget.create({
      userId: data.userId,
      categoryId: data.categoryId || null,
      amount: data.amount,
      month: data.month,
    });
  }

  // 删除预算
  async delete(id: number, userId: number) {
    const budget = await Budget.findOne({
      where: { id, userId },
    });

    if (!budget) {
      throw new AppError("预算不存在", 404, ErrorCode.NOT_FOUND);
    }

    await budget.destroy();
  }

  // 获取预算执行状态
  async getStatus(userId: number, month: string): Promise<BudgetStatus[]> {
    // 获取该月所有预算
    const budgets = await Budget.findAll({
      where: { userId, month },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
          required: false,
        },
      ],
    });

    // 获取该月所有支出
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = `${month}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().split("T")[0];

    const transactions = await Transaction.findAll({
      where: {
        userId,
        type: "expense",
        date: { [Op.gte]: startDate, [Op.lte]: endDate },
      },
      attributes: ["categoryId", "amount"],
    });

    // 按分类汇总支出
    const spentByCategory = new Map<number | null, number>();
    let totalSpent = 0;

    for (const t of transactions) {
      totalSpent += t.amount;
      const catId = t.categoryId;
      spentByCategory.set(catId, (spentByCategory.get(catId) || 0) + t.amount);
    }

    // 计算每个预算的状态
    const result: BudgetStatus[] = [];

    for (const budget of budgets) {
      const cat = (budget as any).category;
      const spent = budget.categoryId
        ? spentByCategory.get(budget.categoryId) || 0
        : totalSpent;

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      let status: "normal" | "warning" | "exceeded" = "normal";

      if (percentage >= 100) {
        status = "exceeded";
      } else if (percentage >= 80) {
        status = "warning";
      }

      result.push({
        budgetId: budget.id,
        categoryId: budget.categoryId,
        categoryName: cat?.name || "总预算",
        budgetAmount: budget.amount,
        spentAmount: Math.round(spent * 100) / 100,
        remainingAmount: Math.round((budget.amount - spent) * 100) / 100,
        percentage: Math.round(percentage * 100) / 100,
        status,
      });
    }

    return result;
  }

  // 检查是否有预算预警
  async checkWarnings(userId: number, month: string) {
    const statuses = await this.getStatus(userId, month);
    return statuses.filter(
      (s) => s.status === "warning" || s.status === "exceeded"
    );
  }
}

export default new BudgetService();
