import { Op, WhereOptions } from "sequelize";
import { Transaction, Account, Category } from "../models";
import { TransactionType } from "../models/Transaction";
import { AppError, ErrorCode } from "../utils/errors";
import { sequelize } from "../config/database";

interface CreateTransactionData {
  userId: number;
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  date: Date | string;
  note?: string;
  familyId?: number;
  isFamily?: boolean;
}

interface UpdateTransactionData {
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  amount?: number;
  date?: Date | string;
  note?: string;
  isFamily?: boolean;
}

interface TransactionFilter {
  userId: number;
  familyId?: number;
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  includeOriginalTransaction?: boolean;
}

class TransactionService {
  // 创建交易记录
  async create(data: CreateTransactionData) {
    const t = await sequelize.transaction();

    try {
      // 验证账户存在且属于用户
      const account = await Account.findOne({
        where: { id: data.accountId, userId: data.userId },
      });
      if (!account) {
        throw new AppError("账户不存在", 404, ErrorCode.NOT_FOUND);
      }

      // 验证分类存在
      const category = await Category.findOne({
        where: {
          id: data.categoryId,
          [Op.or]: [{ userId: null, isSystem: true }, { userId: data.userId }],
        },
      });
      if (!category) {
        throw new AppError("分类不存在", 404, ErrorCode.NOT_FOUND);
      }

      // 创建交易
      const transaction = await Transaction.create(
        {
          userId: data.userId,
          accountId: data.accountId,
          categoryId: data.categoryId,
          type: data.type,
          amount: data.amount,
          date: new Date(data.date),
          note: data.note || "",
          familyId: data.familyId || null,
          isFamily: data.isFamily || false,
        },
        { transaction: t }
      );

      // 更新账户余额
      // 信用账户的支出不扣减余额（提前消费，待还金额通过交易记录计算）
      // 信用账户的收入也不增加余额（信用账户不应有收入）
      const isCreditAccount = account.isCreditAccount();

      if (!isCreditAccount) {
        // 非信用账户：正常更新余额
        const balanceChange =
          data.type === "income" ? data.amount : -data.amount;
        await account.updateBalance(balanceChange, t);
      }
      // 信用账户：不更新余额，待还金额通过 CreditService 计算

      await t.commit();

      // 返回完整的交易记录
      return this.getById(transaction.id, data.userId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // 获取单个交易记录
  async getById(id: number, userId: number) {
    const transaction = await Transaction.findOne({
      where: { id, userId },
      include: [
        {
          model: Account,
          as: "account",
          attributes: ["id", "name", "type", "icon"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "type", "icon"],
        },
      ],
    });

    if (!transaction) {
      throw new AppError("交易记录不存在", 404, ErrorCode.NOT_FOUND);
    }

    return transaction;
  }

  // 获取交易列表（支持筛选和分页）
  async list(filter: TransactionFilter) {
    const {
      userId,
      familyId,
      accountId,
      categoryId,
      type,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
      includeOriginalTransaction = true,
    } = filter;

    const where: WhereOptions = { userId };

    if (familyId) {
      where.familyId = familyId;
    }
    if (accountId) {
      where.accountId = accountId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (type) {
      where.type = type;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as any)[Op.gte] = startDate;
      }
      if (endDate) {
        (where.date as any)[Op.lte] = endDate;
      }
    }

    // 构建 include 数组
    const include: any[] = [
      {
        model: Account,
        as: "account",
        attributes: ["id", "name", "type", "icon"],
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "type", "icon"],
      },
    ];

    // 如果需要包含原交易信息（用于退款交易）
    if (includeOriginalTransaction) {
      include.push({
        model: Transaction,
        as: "originalTransaction",
        required: false,
        attributes: ["id", "amount", "date", "note", "type"],
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "icon"],
          },
        ],
      });
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include,
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      items: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  // 更新交易记录
  async update(id: number, userId: number, data: UpdateTransactionData) {
    const t = await sequelize.transaction();

    try {
      const transaction = await Transaction.findOne({
        where: { id, userId },
      });

      if (!transaction) {
        throw new AppError("交易记录不存在", 404, ErrorCode.NOT_FOUND);
      }

      const oldAmount = transaction.amount;
      const oldType = transaction.type;
      const oldAccountId = transaction.accountId;

      // 如果更换了账户，验证新账户
      if (data.accountId && data.accountId !== oldAccountId) {
        const newAccount = await Account.findOne({
          where: { id: data.accountId, userId },
        });
        if (!newAccount) {
          throw new AppError("账户不存在", 404, ErrorCode.NOT_FOUND);
        }
      }

      // 验证分类
      if (data.categoryId) {
        const category = await Category.findOne({
          where: {
            id: data.categoryId,
            [Op.or]: [{ userId: null, isSystem: true }, { userId }],
          },
        });
        if (!category) {
          throw new AppError("分类不存在", 404, ErrorCode.NOT_FOUND);
        }
      }

      // 计算余额调整
      const newAmount = data.amount ?? oldAmount;
      const newType = data.type ?? oldType;
      const newAccountId = data.accountId ?? oldAccountId;

      // 恢复旧账户余额（仅非信用账户）
      const oldAccount = await Account.findByPk(oldAccountId);
      if (oldAccount && !oldAccount.isCreditAccount()) {
        const oldBalanceChange = oldType === "income" ? -oldAmount : oldAmount;
        await oldAccount.updateBalance(oldBalanceChange, t);
      }

      // 更新新账户余额（仅非信用账户）
      const newAccount = await Account.findByPk(newAccountId);
      if (newAccount && !newAccount.isCreditAccount()) {
        const newBalanceChange = newType === "income" ? newAmount : -newAmount;
        await newAccount.updateBalance(newBalanceChange, t);
      }

      // 更新交易记录
      await transaction.update(
        {
          accountId: newAccountId,
          categoryId: data.categoryId,
          type: newType,
          amount: newAmount,
          date: data.date ? new Date(data.date) : undefined,
          note: data.note,
          isFamily: data.isFamily,
        },
        { transaction: t }
      );

      await t.commit();

      return this.getById(id, userId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // 删除交易记录
  async delete(id: number, userId: number) {
    const t = await sequelize.transaction();

    try {
      const transaction = await Transaction.findOne({
        where: { id, userId },
      });

      if (!transaction) {
        throw new AppError("交易记录不存在", 404, ErrorCode.NOT_FOUND);
      }

      // 恢复账户余额（仅非信用账户）
      const account = await Account.findByPk(transaction.accountId);
      if (account && !account.isCreditAccount()) {
        const balanceChange =
          transaction.type === "income"
            ? -transaction.amount
            : transaction.amount;
        await account.updateBalance(balanceChange, t);
      }

      // 删除交易
      await transaction.destroy({ transaction: t });

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // 获取用户某月的统计摘要
  async getMonthlySummary(userId: number, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const transactions = await Transaction.findAll({
      where: {
        userId,
        date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
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
      month,
      income,
      expense,
      balance: income - expense,
    };
  }
}

export default new TransactionService();
