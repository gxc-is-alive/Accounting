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
        { transaction: t },
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
      // 使用悲观锁获取交易记录，防止并发冲突
      const transaction = await Transaction.findOne({
        where: { id, userId },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!transaction) {
        throw new AppError("交易记录不存在", 404, ErrorCode.NOT_FOUND);
      }

      const oldAmount = transaction.amount;
      const oldType = transaction.type;
      const oldAccountId = transaction.accountId;

      // 计算新值
      const newAmount = data.amount ?? oldAmount;
      const newType = data.type ?? oldType;
      const newAccountId = data.accountId ?? oldAccountId;

      // 如果更换了账户，验证新账户
      if (newAccountId !== oldAccountId) {
        const newAccount = await Account.findOne({
          where: { id: newAccountId, userId },
          transaction: t,
        });
        if (!newAccount) {
          throw new AppError("新账户不存在", 404, ErrorCode.NOT_FOUND);
        }
      }

      // 验证分类
      if (data.categoryId) {
        const category = await Category.findOne({
          where: {
            id: data.categoryId,
            [Op.or]: [{ userId: null, isSystem: true }, { userId }],
          },
          transaction: t,
        });
        if (!category) {
          throw new AppError("分类不存在", 404, ErrorCode.NOT_FOUND);
        }
      }

      // 调整账户余额
      await this.adjustAccountBalanceOnUpdate(
        oldAccountId,
        newAccountId,
        oldAmount,
        newAmount,
        oldType,
        newType,
        userId,
        t,
      );

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
        { transaction: t },
      );

      await t.commit();

      return this.getById(id, userId);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  // 辅助函数：调整账户余额（账户变更时）
  private async adjustAccountBalanceOnUpdate(
    oldAccountId: number,
    newAccountId: number,
    oldAmount: number,
    newAmount: number,
    oldType: TransactionType,
    newType: TransactionType,
    userId: number,
    t: any,
  ) {
    // 如果账户未变更且金额和类型都未变更，无需调整余额
    if (
      oldAccountId === newAccountId &&
      oldAmount === newAmount &&
      oldType === newType
    ) {
      return;
    }

    // 获取原账户（加锁）
    const oldAccount = await Account.findOne({
      where: { id: oldAccountId, userId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!oldAccount) {
      throw new AppError("原账户不存在", 404, ErrorCode.NOT_FOUND);
    }

    // 如果账户变更，获取新账户（加锁）
    let newAccount = oldAccount;
    if (oldAccountId !== newAccountId) {
      const fetchedNewAccount = await Account.findOne({
        where: { id: newAccountId, userId },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!fetchedNewAccount) {
        throw new AppError("新账户不存在", 404, ErrorCode.NOT_FOUND);
      }

      newAccount = fetchedNewAccount;
    }

    // 恢复原账户余额（仅非信用账户）
    if (!oldAccount.isCreditAccount()) {
      // 支出类型：退回金额（增加余额）
      // 收入/退款类型：撤回金额（减少余额）
      const oldBalanceChange = oldType === "expense" ? oldAmount : -oldAmount;
      await oldAccount.updateBalance(oldBalanceChange, t);
    }

    // 如果账户变更，更新新账户余额（仅非信用账户）
    if (oldAccountId !== newAccountId && !newAccount.isCreditAccount()) {
      // 支出类型：扣除金额（减少余额）
      // 收入/退款类型：增加金额（增加余额）
      const newBalanceChange = newType === "expense" ? -newAmount : newAmount;
      await newAccount.updateBalance(newBalanceChange, t);
    } else if (oldAccountId === newAccountId && !oldAccount.isCreditAccount()) {
      // 同一账户但金额或类型变更，直接应用新的余额变化
      const newBalanceChange = newType === "expense" ? -newAmount : newAmount;
      await oldAccount.updateBalance(newBalanceChange, t);
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
