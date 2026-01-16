import { Op } from "sequelize";
import { Transaction, Category, FamilyMember, Account, User } from "../models";
import { AppError, ErrorCode } from "../utils/errors";

interface CategoryStat {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  count: number;
}

// 家庭交易查询筛选条件
interface FamilyTransactionFilters {
  startDate?: string;
  endDate?: string;
  memberId?: number;
  categoryId?: number;
  type?: "income" | "expense";
  page?: number;
  pageSize?: number;
}

// 成员贡献统计
interface MemberContribution {
  userId: number;
  nickname: string;
  income: number;
  expense: number;
  incomePercentage: number;
  expensePercentage: number;
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
    let refund = 0;

    for (const t of transactions) {
      if (t.type === "income") {
        income += t.amount;
      } else if (t.type === "expense") {
        expense += t.amount;
      } else if (t.type === "refund") {
        refund += t.amount;
      }
    }

    // 净支出 = 总支出 - 总退款
    const netExpense = expense - refund;

    return {
      year,
      month: `${year}-${String(month).padStart(2, "0")}`,
      totalIncome: Math.round(income * 100) / 100,
      totalExpense: Math.round(expense * 100) / 100,
      totalRefund: Math.round(refund * 100) / 100,
      netExpense: Math.round(netExpense * 100) / 100,
      balance: Math.round((income - netExpense) * 100) / 100,
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
    // 获取指定类型的交易
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

    // 如果是支出统计，还需要获取退款记录来扣除
    let refundsByCategory = new Map<number, number>();
    if (type === "expense") {
      const refunds = await Transaction.findAll({
        where: {
          userId,
          type: "refund",
          date: { [Op.gte]: startDate, [Op.lte]: endDate },
        },
        attributes: ["categoryId", "amount"],
      });

      for (const r of refunds) {
        const current = refundsByCategory.get(r.categoryId) || 0;
        refundsByCategory.set(r.categoryId, current + r.amount);
      }
    }

    // 按分类汇总
    const categoryMap = new Map<number, CategoryStat>();
    let total = 0;
    let totalRefund = 0;

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

    // 如果是支出统计，从各分类中扣除退款金额
    if (type === "expense") {
      for (const [categoryId, refundAmount] of refundsByCategory) {
        totalRefund += refundAmount;
        if (categoryMap.has(categoryId)) {
          const stat = categoryMap.get(categoryId)!;
          stat.amount = Math.max(0, stat.amount - refundAmount);
        }
      }
    }

    // 计算净总额
    const netTotal = type === "expense" ? total - totalRefund : total;

    // 计算百分比
    const stats: CategoryStat[] = [];
    for (const stat of categoryMap.values()) {
      stat.amount = Math.round(stat.amount * 100) / 100;
      stat.percentage =
        netTotal > 0 ? Math.round((stat.amount / netTotal) * 10000) / 100 : 0;
      stats.push(stat);
    }

    // 按金额排序
    stats.sort((a, b) => b.amount - a.amount);

    return {
      type,
      startDate,
      endDate,
      total: Math.round(total * 100) / 100,
      totalRefund: type === "expense" ? Math.round(totalRefund * 100) / 100 : 0,
      netTotal: Math.round(netTotal * 100) / 100,
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

  // ========== 家庭账单优化：新增方法 ==========

  /**
   * 获取家庭成员的交易记录（基于成员加入时间）
   * 核心逻辑：只统计成员加入家庭之后的交易
   */
  async getFamilyMemberTransactions(
    userId: number,
    familyId: number,
    filters: FamilyTransactionFilters = {}
  ) {
    // 验证用户是家庭成员
    const membership = await FamilyMember.findOne({
      where: { familyId, userId },
    });

    if (!membership) {
      throw new AppError("您不是该家庭的成员", 403, ErrorCode.FORBIDDEN);
    }

    // 获取家庭所有成员及其加入时间
    const members = await FamilyMember.findAll({
      where: { familyId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nickname"],
        },
      ],
    });

    // 构建查询条件：每个成员只统计加入后的交易
    const memberConditions = members.map((m: any) => {
      const condition: any = {
        userId: m.userId,
        date: { [Op.gte]: m.joinedAt },
      };
      return condition;
    });

    // 应用筛选条件
    const whereClause: any = {
      [Op.or]: memberConditions,
    };

    if (filters.startDate) {
      whereClause.date = { ...whereClause.date, [Op.gte]: filters.startDate };
    }
    if (filters.endDate) {
      whereClause.date = { ...whereClause.date, [Op.lte]: filters.endDate };
    }
    if (filters.memberId) {
      whereClause.userId = filters.memberId;
    }
    if (filters.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }
    if (filters.type) {
      whereClause.type = filters.type;
    }

    // 分页参数
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // 查询交易记录
    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nickname"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "icon"],
        },
        {
          model: Account,
          as: "account",
          attributes: ["id", "name", "type"],
        },
      ],
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: pageSize,
      offset,
    });

    // 构建成员映射
    const memberMap = new Map<number, string>();
    members.forEach((m: any) => {
      memberMap.set(m.userId, m.user?.nickname || "未知用户");
    });

    return {
      items: rows.map((t: any) => ({
        id: t.id,
        userId: t.userId,
        userNickname: memberMap.get(t.userId) || t.user?.nickname || "未知用户",
        amount: t.amount,
        type: t.type,
        categoryId: t.categoryId,
        categoryName: t.category?.name || "",
        categoryIcon: t.category?.icon || "",
        accountId: t.accountId,
        accountName: t.account?.name || "",
        date: t.date,
        note: t.note,
        createdAt: t.createdAt,
      })),
      total: count,
      page,
      pageSize,
    };
  }

  /**
   * 计算家庭收支汇总（基于成员加入时间）
   */
  async calculateFamilyIncomeExpense(
    familyId: number,
    startDate?: string,
    endDate?: string
  ): Promise<{
    income: number;
    expense: number;
    memberStats: Map<number, { income: number; expense: number }>;
  }> {
    // 获取家庭所有成员及其加入时间
    const members = await FamilyMember.findAll({
      where: { familyId },
    });

    if (members.length === 0) {
      return { income: 0, expense: 0, memberStats: new Map() };
    }

    // 构建查询条件
    const memberConditions = members.map((m: any) => {
      const condition: any = {
        userId: m.userId,
        date: { [Op.gte]: m.joinedAt },
      };
      if (startDate) {
        condition.date[Op.gte] =
          startDate > m.joinedAt.toISOString().split("T")[0]
            ? startDate
            : m.joinedAt.toISOString().split("T")[0];
      }
      if (endDate) {
        condition.date[Op.lte] = endDate;
      }
      return condition;
    });

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: memberConditions,
      },
      attributes: ["userId", "type", "amount"],
    });

    let income = 0;
    let expense = 0;
    const memberStats = new Map<number, { income: number; expense: number }>();

    for (const t of transactions) {
      if (!memberStats.has(t.userId)) {
        memberStats.set(t.userId, { income: 0, expense: 0 });
      }
      const stat = memberStats.get(t.userId)!;

      if (t.type === "income") {
        income += t.amount;
        stat.income += t.amount;
      } else if (t.type === "expense") {
        expense += t.amount;
        stat.expense += t.amount;
      }
    }

    return { income, expense, memberStats };
  }

  /**
   * 获取家庭总存款（所有成员账户余额之和）
   */
  async getFamilyTotalAssets(userId: number, familyId: number) {
    // 验证用户是家庭成员
    const membership = await FamilyMember.findOne({
      where: { familyId, userId },
    });

    if (!membership) {
      throw new AppError("您不是该家庭的成员", 403, ErrorCode.FORBIDDEN);
    }

    // 获取家庭所有成员
    const members = await FamilyMember.findAll({
      where: { familyId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nickname"],
        },
      ],
    });

    const memberIds = members.map((m: any) => m.userId);

    // 获取所有成员的账户
    const accounts = await Account.findAll({
      where: { userId: { [Op.in]: memberIds } },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nickname"],
        },
      ],
    });

    // 按账户类型分组统计
    const byAccountType: Record<
      string,
      { type: string; typeName: string; total: number }
    > = {};
    const accountTypeNames: Record<string, string> = {
      cash: "现金",
      bank: "银行卡",
      alipay: "支付宝",
      wechat: "微信",
      credit: "信用卡",
      other: "其他",
    };

    // 按成员分组统计
    const byMember: Record<
      number,
      {
        userId: number;
        nickname: string;
        accounts: Array<{
          id: number;
          name: string;
          type: string;
          balance: number;
        }>;
        totalBalance: number;
      }
    > = {};

    let totalAssets = 0;

    for (const account of accounts) {
      const acc = account as any;
      const balance = acc.balance || 0;

      // 信用卡余额为负数表示欠款，不计入总资产
      // 如果信用卡余额为正数（还款超额），则计入
      if (acc.type === "credit" && balance < 0) {
        // 信用卡欠款不计入总资产，但仍显示在明细中
      } else {
        totalAssets += balance;
      }

      // 按类型汇总
      if (!byAccountType[acc.type]) {
        byAccountType[acc.type] = {
          type: acc.type,
          typeName: accountTypeNames[acc.type] || acc.type,
          total: 0,
        };
      }
      byAccountType[acc.type].total += balance;

      // 按成员汇总
      if (!byMember[acc.userId]) {
        const member = members.find((m: any) => m.userId === acc.userId) as any;
        byMember[acc.userId] = {
          userId: acc.userId,
          nickname: member?.user?.nickname || acc.user?.nickname || "未知用户",
          accounts: [],
          totalBalance: 0,
        };
      }
      byMember[acc.userId].accounts.push({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance,
      });
      byMember[acc.userId].totalBalance += balance;
    }

    return {
      familyId,
      totalAssets: Math.round(totalAssets * 100) / 100,
      byAccountType: Object.values(byAccountType).map((item) => ({
        ...item,
        total: Math.round(item.total * 100) / 100,
      })),
      byMember: Object.values(byMember).map((item) => ({
        ...item,
        totalBalance: Math.round(item.totalBalance * 100) / 100,
        accounts: item.accounts.map((a) => ({
          ...a,
          balance: Math.round(a.balance * 100) / 100,
        })),
      })),
    };
  }

  /**
   * 获取家庭概览统计
   * 包含：总收入、总支出、结余、总存款、各成员贡献
   */
  async getFamilyOverview(
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

    // 获取家庭信息
    const { Family } = await import("../models");
    const family = await Family.findByPk(familyId);
    if (!family) {
      throw new AppError("家庭不存在", 404, ErrorCode.NOT_FOUND);
    }

    // 获取家庭所有成员
    const members = await FamilyMember.findAll({
      where: { familyId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nickname"],
        },
      ],
    });

    // 计算日期范围
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    // 计算家庭收支
    const { income, expense, memberStats } =
      await this.calculateFamilyIncomeExpense(familyId, startDate, endDate);

    // 获取家庭总存款
    const assets = await this.getFamilyTotalAssets(userId, familyId);

    // 构建成员贡献列表
    const memberContributions: MemberContribution[] = members.map((m: any) => {
      const stat = memberStats.get(m.userId) || { income: 0, expense: 0 };
      return {
        userId: m.userId,
        nickname: m.user?.nickname || "未知用户",
        income: Math.round(stat.income * 100) / 100,
        expense: Math.round(stat.expense * 100) / 100,
        incomePercentage:
          income > 0 ? Math.round((stat.income / income) * 10000) / 100 : 0,
        expensePercentage:
          expense > 0 ? Math.round((stat.expense / expense) * 10000) / 100 : 0,
      };
    });

    return {
      familyId,
      familyName: family.name,
      period: {
        year,
        month,
      },
      totalIncome: Math.round(income * 100) / 100,
      totalExpense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100,
      totalAssets: assets.totalAssets,
      memberCount: members.length,
      memberContributions,
    };
  }

  /**
   * 获取家庭年度统计
   * 包含：年度总收入、总支出、结余、12个月趋势、分类占比、成员贡献
   */
  async getFamilyYearlyStats(userId: number, familyId: number, year: number) {
    // 验证用户是家庭成员
    const membership = await FamilyMember.findOne({
      where: { familyId, userId },
    });

    if (!membership) {
      throw new AppError("您不是该家庭的成员", 403, ErrorCode.FORBIDDEN);
    }

    // 获取家庭信息
    const { Family } = await import("../models");
    const family = await Family.findByPk(familyId);
    if (!family) {
      throw new AppError("家庭不存在", 404, ErrorCode.NOT_FOUND);
    }

    // 获取家庭所有成员及其加入时间
    const members = await FamilyMember.findAll({
      where: { familyId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nickname"],
        },
      ],
    });

    // 构建查询条件：每个成员只统计加入后的交易
    const memberConditions = members.map((m: any) => {
      const joinedDate = m.joinedAt.toISOString().split("T")[0];
      const yearStart = `${year}-01-01`;
      const effectiveStart = joinedDate > yearStart ? joinedDate : yearStart;

      return {
        userId: m.userId,
        date: {
          [Op.gte]: effectiveStart,
          [Op.lte]: `${year}-12-31`,
        },
      };
    });

    // 查询全年交易
    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: memberConditions,
      },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "icon"],
        },
      ],
      attributes: ["userId", "type", "amount", "date", "categoryId"],
    });

    // 统计年度总收入和支出
    let totalIncome = 0;
    let totalExpense = 0;

    // 按月统计
    const monthlyStats: Array<{
      month: number;
      label: string;
      income: number;
      expense: number;
      balance: number;
    }> = [];

    for (let month = 1; month <= 12; month++) {
      monthlyStats.push({
        month,
        label: `${year}-${String(month).padStart(2, "0")}`,
        income: 0,
        expense: 0,
        balance: 0,
      });
    }

    // 按分类统计支出
    const categoryExpenseMap = new Map<
      number,
      {
        categoryId: number;
        categoryName: string;
        categoryIcon: string;
        amount: number;
      }
    >();

    // 按成员统计
    const memberStatsMap = new Map<
      number,
      { income: number; expense: number }
    >();

    for (const t of transactions) {
      const trans = t as any;
      const month = parseInt(trans.date.split("-")[1], 10);
      const monthStat = monthlyStats[month - 1];

      if (trans.type === "income") {
        totalIncome += trans.amount;
        monthStat.income += trans.amount;
      } else if (trans.type === "expense") {
        totalExpense += trans.amount;
        monthStat.expense += trans.amount;

        // 分类统计（仅支出）
        if (trans.categoryId && trans.category) {
          if (!categoryExpenseMap.has(trans.categoryId)) {
            categoryExpenseMap.set(trans.categoryId, {
              categoryId: trans.categoryId,
              categoryName: trans.category.name,
              categoryIcon: trans.category.icon,
              amount: 0,
            });
          }
          categoryExpenseMap.get(trans.categoryId)!.amount += trans.amount;
        }
      }

      // 成员统计
      if (!memberStatsMap.has(trans.userId)) {
        memberStatsMap.set(trans.userId, { income: 0, expense: 0 });
      }
      const memberStat = memberStatsMap.get(trans.userId)!;
      if (trans.type === "income") {
        memberStat.income += trans.amount;
      } else if (trans.type === "expense") {
        memberStat.expense += trans.amount;
      }
    }

    // 计算月度结余
    for (const stat of monthlyStats) {
      stat.income = Math.round(stat.income * 100) / 100;
      stat.expense = Math.round(stat.expense * 100) / 100;
      stat.balance = Math.round((stat.income - stat.expense) * 100) / 100;
    }

    // 计算分类占比
    const categoryBreakdown = Array.from(categoryExpenseMap.values())
      .map((cat) => ({
        ...cat,
        amount: Math.round(cat.amount * 100) / 100,
        percentage:
          totalExpense > 0
            ? Math.round((cat.amount / totalExpense) * 10000) / 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 构建成员贡献列表
    const memberContributions: MemberContribution[] = members.map((m: any) => {
      const stat = memberStatsMap.get(m.userId) || { income: 0, expense: 0 };
      return {
        userId: m.userId,
        nickname: m.user?.nickname || "未知用户",
        income: Math.round(stat.income * 100) / 100,
        expense: Math.round(stat.expense * 100) / 100,
        incomePercentage:
          totalIncome > 0
            ? Math.round((stat.income / totalIncome) * 10000) / 100
            : 0,
        expensePercentage:
          totalExpense > 0
            ? Math.round((stat.expense / totalExpense) * 10000) / 100
            : 0,
      };
    });

    return {
      familyId,
      familyName: family.name,
      year,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      totalBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
      monthlyTrend: monthlyStats,
      categoryBreakdown,
      memberContributions,
    };
  }
}

export default new StatisticsService();
