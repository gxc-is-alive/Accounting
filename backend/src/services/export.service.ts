/**
 * 数据导出服务
 * Feature: data-export-docker
 */

import {
  User,
  Account,
  Category,
  BillType,
  Transaction,
  Budget,
  Family,
  FamilyMember,
} from "../models";
import { Op } from "sequelize";

// 导出版本号
export const EXPORT_VERSION = "1.0.0";

// 导出数据接口
export interface ExportData {
  version: string;
  exportedAt: string;
  user: UserExportData;
  accounts: AccountExportData[];
  categories: CategoryExportData[];
  billTypes: BillTypeExportData[];
  transactions: TransactionExportData[];
  budgets: BudgetExportData[];
  family?: FamilyExportData;
}

export interface UserExportData {
  email: string;
  nickname: string;
}

export interface AccountExportData {
  name: string;
  type: string;
  balance: number;
  icon?: string;
  creditLimit?: number;
  billingDay?: number;
  dueDay?: number;
}

export interface CategoryExportData {
  name: string;
  type: "income" | "expense";
  icon: string;
  isSystem: boolean;
  parentName?: string;
}

export interface BillTypeExportData {
  name: string;
  description: string;
  icon: string;
  isSystem: boolean;
}

export interface TransactionExportData {
  type: "income" | "expense" | "repayment";
  amount: number;
  date: string;
  accountName: string;
  categoryName: string;
  billTypeName: string;
  note: string;
  isFamily: boolean;
}

export interface BudgetExportData {
  categoryName: string | null;
  amount: number;
  month: string;
}

export interface FamilyExportData {
  name: string;
  members: { email: string; role: string }[];
  transactions: TransactionExportData[];
}

// 导入结果接口
export interface ImportResult {
  success: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// 验证结果接口
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

class ExportService {
  /**
   * 导出用户所有数据为 JSON
   */
  async exportToJson(
    userId: number,
    includeFamily: boolean = false
  ): Promise<ExportData> {
    // 获取用户信息
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("用户不存在");
    }

    // 获取用户账户
    const accounts = await Account.findAll({
      where: { userId },
      order: [["id", "ASC"]],
    });

    // 获取用户分类（包括系统分类）
    const categories = await Category.findAll({
      where: {
        [Op.or]: [{ userId }, { userId: null, isSystem: true }],
      },
      order: [["id", "ASC"]],
    });

    // 构建分类名称映射
    const categoryMap = new Map<number, Category>();
    categories.forEach((c) => categoryMap.set(c.id, c));

    // 获取用户账单类型（包括系统类型）
    const billTypes = await BillType.findAll({
      where: {
        [Op.or]: [{ userId }, { userId: null, isSystem: true }],
      },
      order: [["id", "ASC"]],
    });

    // 构建账单类型映射
    const billTypeMap = new Map<number, BillType>();
    billTypes.forEach((b) => billTypeMap.set(b.id, b));

    // 构建账户映射
    const accountMap = new Map<number, Account>();
    accounts.forEach((a) => accountMap.set(a.id, a));

    // 获取用户交易记录
    const transactions = await Transaction.findAll({
      where: { userId, isFamily: false },
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
    });

    // 获取用户预算
    const budgets = await Budget.findAll({
      where: { userId },
      order: [["month", "DESC"]],
    });

    // 构建导出数据
    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email,
        nickname: user.nickname,
      },
      accounts: accounts.map((a) => ({
        name: a.name,
        type: a.type,
        balance: a.balance,
        icon: a.icon,
        creditLimit: a.creditLimit,
        billingDay: a.billingDay,
        dueDay: a.dueDay,
      })),
      categories: categories
        .filter((c) => !c.isSystem || c.userId === userId)
        .map((c) => {
          const parent = c.parentId ? categoryMap.get(c.parentId) : null;
          return {
            name: c.name,
            type: c.type,
            icon: c.icon,
            isSystem: c.isSystem,
            parentName: parent?.name,
          };
        }),
      billTypes: billTypes
        .filter((b) => !b.isSystem || b.userId === userId)
        .map((b) => ({
          name: b.name,
          description: b.description,
          icon: b.icon,
          isSystem: b.isSystem,
        })),
      transactions: transactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        date:
          t.date instanceof Date
            ? t.date.toISOString().split("T")[0]
            : String(t.date),
        accountName: accountMap.get(t.accountId)?.name || "",
        categoryName: categoryMap.get(t.categoryId)?.name || "",
        billTypeName: billTypeMap.get(t.billTypeId)?.name || "",
        note: t.note,
        isFamily: t.isFamily,
      })),
      budgets: budgets.map((b) => ({
        categoryName: b.categoryId
          ? categoryMap.get(b.categoryId)?.name || null
          : null,
        amount: b.amount,
        month: b.month,
      })),
    };

    // 如果需要包含家庭数据
    if (includeFamily) {
      const familyData = await this.exportFamilyData(
        userId,
        accountMap,
        categoryMap,
        billTypeMap
      );
      if (familyData) {
        exportData.family = familyData;
      }
    }

    return exportData;
  }

  /**
   * 导出家庭数据
   */
  private async exportFamilyData(
    userId: number,
    accountMap: Map<number, Account>,
    categoryMap: Map<number, Category>,
    billTypeMap: Map<number, BillType>
  ): Promise<FamilyExportData | null> {
    // 查找用户所属家庭
    const membership = await FamilyMember.findOne({
      where: { userId },
    });

    if (!membership) {
      return null;
    }

    const family = await Family.findByPk(membership.familyId);
    if (!family) {
      return null;
    }

    // 获取家庭成员
    const members = await FamilyMember.findAll({
      where: { familyId: family.id },
      include: [{ model: User, as: "user" }],
    });

    // 获取家庭交易记录
    const familyTransactions = await Transaction.findAll({
      where: { familyId: family.id, isFamily: true },
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
    });

    return {
      name: family.name,
      members: members.map((m) => ({
        email: (m as any).user?.email || "",
        role: m.role,
      })),
      transactions: familyTransactions.map((t) => ({
        type: t.type,
        amount: t.amount,
        date:
          t.date instanceof Date
            ? t.date.toISOString().split("T")[0]
            : String(t.date),
        accountName: accountMap.get(t.accountId)?.name || "",
        categoryName: categoryMap.get(t.categoryId)?.name || "",
        billTypeName: billTypeMap.get(t.billTypeId)?.name || "",
        note: t.note,
        isFamily: t.isFamily,
      })),
    };
  }

  /**
   * 导出交易记录为 CSV
   */
  async exportToCsv(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    // 构建查询条件
    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date[Op.gte] = startDate;
      }
      if (endDate) {
        where.date[Op.lte] = endDate;
      }
    }

    // 获取交易记录
    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: Account, as: "account" },
        { model: Category, as: "category" },
        { model: BillType, as: "billType" },
      ],
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
    });

    // CSV 头部（UTF-8 BOM + 表头）
    const BOM = "\uFEFF";
    const headers = [
      "日期",
      "类型",
      "金额",
      "分类",
      "账户",
      "账单类型",
      "备注",
    ];
    const rows: string[] = [headers.join(",")];

    // 转换交易记录为 CSV 行
    for (const t of transactions) {
      const typeText =
        t.type === "income" ? "收入" : t.type === "expense" ? "支出" : "还款";
      const date =
        t.date instanceof Date
          ? t.date.toISOString().split("T")[0]
          : String(t.date);
      const row = [
        date,
        typeText,
        t.amount.toString(),
        this.escapeCsvField((t as any).category?.name || ""),
        this.escapeCsvField((t as any).account?.name || ""),
        this.escapeCsvField((t as any).billType?.name || ""),
        this.escapeCsvField(t.note),
      ];
      rows.push(row.join(","));
    }

    return BOM + rows.join("\n");
  }

  /**
   * 转义 CSV 字段
   */
  private escapeCsvField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  /**
   * 验证导入数据格式
   */
  validateImportData(data: unknown): ValidationResult {
    const errors: string[] = [];

    if (!data || typeof data !== "object") {
      return { valid: false, errors: ["数据格式无效"] };
    }

    const d = data as Record<string, unknown>;

    // 检查版本
    if (!d.version || typeof d.version !== "string") {
      errors.push("缺少版本号");
    } else if (!this.isVersionCompatible(d.version as string)) {
      errors.push(`版本不兼容: ${d.version}，当前支持版本: ${EXPORT_VERSION}`);
    }

    // 检查必需字段
    if (!d.exportedAt || typeof d.exportedAt !== "string") {
      errors.push("缺少导出时间");
    }

    if (!d.user || typeof d.user !== "object") {
      errors.push("缺少用户信息");
    }

    if (!Array.isArray(d.accounts)) {
      errors.push("缺少账户数据");
    }

    if (!Array.isArray(d.categories)) {
      errors.push("缺少分类数据");
    }

    if (!Array.isArray(d.billTypes)) {
      errors.push("缺少账单类型数据");
    }

    if (!Array.isArray(d.transactions)) {
      errors.push("缺少交易记录");
    }

    if (!Array.isArray(d.budgets)) {
      errors.push("缺少预算数据");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查版本兼容性
   */
  private isVersionCompatible(version: string): boolean {
    const [major] = version.split(".");
    const [currentMajor] = EXPORT_VERSION.split(".");
    return major === currentMajor;
  }

  /**
   * 从 JSON 导入数据
   */
  async importFromJson(
    userId: number,
    data: ExportData,
    mode: "skip" | "overwrite" = "skip"
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // 验证数据
    const validation = this.validateImportData(data);
    if (!validation.valid) {
      return {
        ...result,
        failed: 1,
        errors: validation.errors,
      };
    }

    try {
      // 1. 导入分类
      const categoryResult = await this.importCategories(
        userId,
        data.categories,
        mode
      );
      result.success += categoryResult.success;
      result.skipped += categoryResult.skipped;
      result.failed += categoryResult.failed;
      result.errors.push(...categoryResult.errors);

      // 2. 导入账户
      const accountResult = await this.importAccounts(
        userId,
        data.accounts,
        mode
      );
      result.success += accountResult.success;
      result.skipped += accountResult.skipped;
      result.failed += accountResult.failed;
      result.errors.push(...accountResult.errors);

      // 3. 导入账单类型
      const billTypeResult = await this.importBillTypes(
        userId,
        data.billTypes,
        mode
      );
      result.success += billTypeResult.success;
      result.skipped += billTypeResult.skipped;
      result.failed += billTypeResult.failed;
      result.errors.push(...billTypeResult.errors);

      // 4. 导入交易记录
      const transactionResult = await this.importTransactions(
        userId,
        data.transactions
      );
      result.success += transactionResult.success;
      result.skipped += transactionResult.skipped;
      result.failed += transactionResult.failed;
      result.errors.push(...transactionResult.errors);

      // 5. 导入预算
      const budgetResult = await this.importBudgets(userId, data.budgets, mode);
      result.success += budgetResult.success;
      result.skipped += budgetResult.skipped;
      result.failed += budgetResult.failed;
      result.errors.push(...budgetResult.errors);
    } catch (error) {
      result.failed++;
      result.errors.push(`导入失败: ${(error as Error).message}`);
    }

    return result;
  }

  /**
   * 导入分类
   */
  private async importCategories(
    userId: number,
    categories: CategoryExportData[],
    mode: "skip" | "overwrite"
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const cat of categories) {
      if (cat.isSystem) {
        result.skipped++;
        continue;
      }

      try {
        const existing = await Category.findOne({
          where: { userId, name: cat.name, type: cat.type },
        });

        if (existing) {
          if (mode === "overwrite") {
            await existing.update({ icon: cat.icon });
            result.success++;
          } else {
            result.skipped++;
          }
        } else {
          // 查找父分类
          let parentId: number | null = null;
          if (cat.parentName) {
            const parent = await Category.findOne({
              where: {
                [Op.or]: [{ userId }, { userId: null, isSystem: true }],
                name: cat.parentName,
                type: cat.type,
              },
            });
            parentId = parent?.id || null;
          }

          await Category.create({
            userId,
            name: cat.name,
            type: cat.type,
            icon: cat.icon,
            isSystem: false,
            parentId,
          });
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `分类 "${cat.name}" 导入失败: ${(error as Error).message}`
        );
      }
    }

    return result;
  }

  /**
   * 导入账户
   */
  private async importAccounts(
    userId: number,
    accounts: AccountExportData[],
    mode: "skip" | "overwrite"
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const acc of accounts) {
      try {
        const existing = await Account.findOne({
          where: { userId, name: acc.name },
        });

        if (existing) {
          if (mode === "overwrite") {
            await existing.update({
              type: acc.type as any,
              balance: acc.balance,
              icon: acc.icon,
              creditLimit: acc.creditLimit,
              billingDay: acc.billingDay,
              dueDay: acc.dueDay,
            });
            result.success++;
          } else {
            result.skipped++;
          }
        } else {
          await Account.create({
            userId,
            name: acc.name,
            type: acc.type as any,
            balance: acc.balance,
            icon: acc.icon,
            creditLimit: acc.creditLimit,
            billingDay: acc.billingDay,
            dueDay: acc.dueDay,
          });
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `账户 "${acc.name}" 导入失败: ${(error as Error).message}`
        );
      }
    }

    return result;
  }

  /**
   * 导入账单类型
   */
  private async importBillTypes(
    userId: number,
    billTypes: BillTypeExportData[],
    mode: "skip" | "overwrite"
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (const bt of billTypes) {
      if (bt.isSystem) {
        result.skipped++;
        continue;
      }

      try {
        const existing = await BillType.findOne({
          where: { userId, name: bt.name },
        });

        if (existing) {
          if (mode === "overwrite") {
            await existing.update({
              description: bt.description,
              icon: bt.icon,
            });
            result.success++;
          } else {
            result.skipped++;
          }
        } else {
          await BillType.create({
            userId,
            name: bt.name,
            description: bt.description,
            icon: bt.icon,
            isSystem: false,
          });
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `账单类型 "${bt.name}" 导入失败: ${(error as Error).message}`
        );
      }
    }

    return result;
  }

  /**
   * 导入交易记录
   */
  private async importTransactions(
    userId: number,
    transactions: TransactionExportData[]
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // 获取用户的账户、分类、账单类型映射
    const accounts = await Account.findAll({ where: { userId } });
    const accountMap = new Map<string, number>();
    accounts.forEach((a) => accountMap.set(a.name, a.id));

    const categories = await Category.findAll({
      where: { [Op.or]: [{ userId }, { userId: null, isSystem: true }] },
    });
    const categoryMap = new Map<string, number>();
    categories.forEach((c) => categoryMap.set(`${c.name}-${c.type}`, c.id));

    const billTypes = await BillType.findAll({
      where: { [Op.or]: [{ userId }, { userId: null, isSystem: true }] },
    });
    const billTypeMap = new Map<string, number>();
    billTypes.forEach((b) => billTypeMap.set(b.name, b.id));

    for (const t of transactions) {
      try {
        const accountId = accountMap.get(t.accountName);
        const categoryId = categoryMap.get(
          `${t.categoryName}-${t.type === "repayment" ? "expense" : t.type}`
        );
        const billTypeId = billTypeMap.get(t.billTypeName);

        if (!accountId) {
          result.failed++;
          result.errors.push(`交易导入失败: 账户 "${t.accountName}" 不存在`);
          continue;
        }

        if (!categoryId) {
          result.failed++;
          result.errors.push(`交易导入失败: 分类 "${t.categoryName}" 不存在`);
          continue;
        }

        if (!billTypeId) {
          result.failed++;
          result.errors.push(
            `交易导入失败: 账单类型 "${t.billTypeName}" 不存在`
          );
          continue;
        }

        await Transaction.create({
          userId,
          accountId,
          categoryId,
          billTypeId,
          type: t.type,
          amount: t.amount,
          date: new Date(t.date),
          note: t.note,
          isFamily: false,
        });
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`交易导入失败: ${(error as Error).message}`);
      }
    }

    return result;
  }

  /**
   * 导入预算
   */
  private async importBudgets(
    userId: number,
    budgets: BudgetExportData[],
    mode: "skip" | "overwrite"
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    // 获取分类映射
    const categories = await Category.findAll({
      where: { [Op.or]: [{ userId }, { userId: null, isSystem: true }] },
    });
    const categoryMap = new Map<string, number>();
    categories.forEach((c) => categoryMap.set(c.name, c.id));

    for (const b of budgets) {
      try {
        let categoryId: number | null = null;
        if (b.categoryName) {
          categoryId = categoryMap.get(b.categoryName) || null;
          if (!categoryId) {
            result.failed++;
            result.errors.push(`预算导入失败: 分类 "${b.categoryName}" 不存在`);
            continue;
          }
        }

        const existing = await Budget.findOne({
          where: { userId, categoryId, month: b.month },
        });

        if (existing) {
          if (mode === "overwrite") {
            await existing.update({ amount: b.amount });
            result.success++;
          } else {
            result.skipped++;
          }
        } else {
          await Budget.create({
            userId,
            categoryId,
            amount: b.amount,
            month: b.month,
          });
          result.success++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`预算导入失败: ${(error as Error).message}`);
      }
    }

    return result;
  }
}

export const exportService = new ExportService();
export default ExportService;
