import { Account } from "../models";
import { AppError, ErrorCode } from "../utils/errors";
import type { AccountType } from "../types";

interface CreateAccountData {
  userId: number;
  name: string;
  type: AccountType;
  initialBalance?: number;
  icon?: string;
  // 信用账户扩展字段
  creditLimit?: number;
  billingDay?: number;
  dueDay?: number;
}

interface UpdateAccountData {
  name?: string;
  type?: AccountType;
  icon?: string;
  // 信用账户扩展字段
  creditLimit?: number;
  billingDay?: number;
  dueDay?: number;
}

class AccountService {
  // 创建账户
  async create(data: CreateAccountData): Promise<Account> {
    const account = await Account.create({
      userId: data.userId,
      name: data.name,
      type: data.type,
      balance: data.initialBalance || 0,
      icon: data.icon,
      // 信用账户扩展字段
      creditLimit: data.type === "credit" ? data.creditLimit : undefined,
      billingDay: data.type === "credit" ? data.billingDay : undefined,
      dueDay: data.type === "credit" ? data.dueDay : undefined,
    });
    return account;
  }

  // 获取用户的所有账户
  async getByUserId(userId: number): Promise<Account[]> {
    const accounts = await Account.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    return accounts;
  }

  // 根据 ID 获取账户
  async getById(id: number, userId: number): Promise<Account> {
    const account = await Account.findOne({
      where: { id, userId },
    });
    if (!account) {
      throw new AppError("账户不存在", 404, ErrorCode.ACCOUNT_NOT_FOUND);
    }
    return account;
  }

  // 更新账户
  async update(
    id: number,
    userId: number,
    data: UpdateAccountData
  ): Promise<Account> {
    const account = await this.getById(id, userId);

    if (data.name !== undefined) account.name = data.name;
    if (data.type !== undefined) account.type = data.type;
    if (data.icon !== undefined) account.icon = data.icon;

    // 信用账户扩展字段
    if (account.isCreditAccount()) {
      if (data.creditLimit !== undefined)
        account.creditLimit = data.creditLimit;
      if (data.billingDay !== undefined) account.billingDay = data.billingDay;
      if (data.dueDay !== undefined) account.dueDay = data.dueDay;
    }

    await account.save();
    return account;
  }

  // 删除账户
  async delete(id: number, userId: number): Promise<void> {
    const account = await this.getById(id, userId);

    // TODO: 检查是否有关联的交易记录
    // const transactionCount = await Transaction.count({ where: { accountId: id } });
    // if (transactionCount > 0) {
    //   throw new AppError('该账户存在交易记录，无法删除', 400, ErrorCode.ACCOUNT_HAS_TRANSACTIONS);
    // }

    await account.destroy();
  }

  // 更新账户余额
  async updateBalance(
    id: number,
    amount: number,
    isIncome: boolean
  ): Promise<Account> {
    const account = await Account.findByPk(id);
    if (!account) {
      throw new AppError("账户不存在", 404, ErrorCode.ACCOUNT_NOT_FOUND);
    }

    const balanceChange = isIncome ? amount : -amount;
    await account.updateBalance(balanceChange);
    return account;
  }
}

export default new AccountService();
