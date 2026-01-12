import { Op, fn, col, literal } from "sequelize";
import { Transaction, Category, FamilyMember } from "../models";
import { AppError, ErrorCode } from "../utils/errors";

interface CategoryStat {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  count: number;
}

class StatisticsService {
  // 获取月度统计
  async getMonthlyStats(userId: number, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: { [Op.gte]: startDate, [Op.lte]: endDate },
      },
      attributes: ["type", "amount"],
    });

    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      if (t.type === "income") {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    }

    return {
      year,
      month: `${year}-${String(month).padStart(2, "0")}`,
      totalIncome: Math.round(income * 100) / 100,
      totalExpense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100,
      transactionCount: transactions.length,
      categoryBreakdown: [],
    };
  }

  // 获取分类统计
  async getCategoryStats(
    userId: number,
    type: "income" | "expense",
    startDate: string,
    endDate: string
  ) {
    const transactions = await Transaction.findAll({
      where: {
        userId,
        type,
        date: { [Op.gte]: startDate, [Op.lte]: endDate },
      },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "icon"],
        },
      ],
    });

    // 按分类汇总
    const categoryMap = new Map<number, CategoryStat>();
    let total = 0;

    for (const t of transactions) {
      const cat = (t as any).category;
      if (!cat) continue;

      total += t.amount;

      if (categoryMap.has(cat.id)) {
        const stat = categoryMap.get(cat.id)!;
        stat.amount += t.amount;
        stat.count += 1;
      } else {
        categoryMap.set(cat.id, {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          amount: t.amount,
          percentage: 0,
          count: 1,
        });
      }
    }

    // 计算百分比
    const stats: CategoryStat[] = [];
    for (const stat of categoryMap.values()) {
      stat.amount = Math.round(stat.amount * 100) / 100;
      stat.percentage =
        total > 0 ? Math.round((stat.amount / total) * 10000) / 100 : 0;
      stats.push(stat);
    }

    // 按金额排序
    stats.sort((a, b) => b.amount - a.amount);

    return {
      type,
      startDate,
      endDate,
      total: Math.round(total * 100) / 100,
      categories: stats,
    };
  }

  // 获取趋势数据（最近N个月）
  async getTrendStats(userId: number, months: number = 6) {
    const result = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const stats = await this.getMonthlyStats(userId, year, month);
      result.push({
        year,
        month,
        label: `${year}-${String(month).padStart(2, "0")}`,
        income: stats.totalIncome,
        expense: stats.totalExpense,
        balance: stats.balance,
      });
    }

    return result;
  }

  // 获取年度统计
  async getYearlyStats(userId: number, year: number) {
    const monthlyStats = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (let month = 1; month <= 12; month++) {
      const stats = await this.getMonthlyStats(userId, year, month);
      monthlyStats.push(stats);
      totalIncome += stats.totalIncome;
      totalExpense += stats.totalExpense;
    }

    return {
      year,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      totalBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
      monthlyStats,
    };
  }

  // 获取家庭统计
  async getFamilyStats(
    userId: number,
    familyId: number,
    year: number,
    month: number
  ) {
    // 验证用户是家庭成员
    const membership = await FamilyMember.findOne({
      where: { familyId, userId },
    });

    if (!membership) {
      throw new AppError("您不是该家庭的成员", 403, ErrorCode.FORBIDDEN);
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const transactions = await Transaction.findAll({
      where: {
        familyId,
        isFamily: true,
        date: { [Op.gte]: startDate, [Op.lte]: endDate },
      },
      attributes: ["type", "amount", "userId"],
    });

    let income = 0;
    let expense = 0;
    const memberStats = new Map<number, { income: number; expense: number }>();

    for (const t of transactions) {
      if (t.type === "income") {
        income += t.amount;
      } else {
        expense += t.amount;
      }

      // 按成员统计
      if (!memberStats.has(t.userId)) {
        memberStats.set(t.userId, { income: 0, expense: 0 });
      }
      const stat = memberStats.get(t.userId)!;
      if (t.type === "income") {
        stat.income += t.amount;
      } else {
        stat.expense += t.amount;
      }
    }

    return {
      familyId,
      year,
      month,
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100,
      memberContributions: Array.from(memberStats.entries()).map(
        ([userId, stat]) => ({
          userId,
          income: Math.round(stat.income * 100) / 100,
          expense: Math.round(stat.expense * 100) / 100,
        })
      ),
    };
  }
}

export default new StatisticsService();
