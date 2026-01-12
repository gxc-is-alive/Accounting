/**
 * 信用账户服务
 * 提供信用额度计算、待还金额计算等功能
 */

import { Op } from "sequelize";
import Account from "../models/Account";
import Transaction from "../models/Transaction";

// 还款提醒接口
export interface DueReminder {
  accountId: number;
  accountName: string;
  outstandingBalance: number;
  dueDay: number;
  daysUntilDue: number;
  isOverdue: boolean;
}

// 信用账户详情接口
export interface CreditAccountDetails {
  id: number;
  name: string;
  creditLimit: number;
  billingDay: number;
  dueDay: number;
  outstandingBalance: number;
  availableCredit: number;
}

class CreditService {
  /**
   * 计算可用额度
   * 可用额度 = 信用额度 - 待还金额
   */
  calculateAvailableCredit(
    creditLimit: number,
    outstandingBalance: number
  ): number {
    return creditLimit - outstandingBalance;
  }

  /**
   * 计算待还金额（基于交易记录）
   * 待还金额 = 总信用消费 - 总还款
   */
  async calculateOutstandingBalance(accountId: number): Promise<number> {
    // 获取所有使用该信用账户的支出交易总额
    const expenseResult = await Transaction.sum("amount", {
      where: {
        accountId,
        type: "expense",
      },
    });

    // 获取所有该信用账户的还款交易总额
    const repaymentResult = await Transaction.sum("amount", {
      where: {
        accountId,
        type: "repayment",
      },
    });

    const totalExpense = expenseResult || 0;
    const totalRepayment = repaymentResult || 0;

    // 待还金额 = 总支出 - 总还款，最小为 0
    return Math.max(0, totalExpense - totalRepayment);
  }

  /**
   * 获取信用账户详情（包含计算字段）
   */
  async getCreditAccountDetails(
    accountId: number
  ): Promise<CreditAccountDetails | null> {
    const account = await Account.findByPk(accountId);

    if (!account || !account.isCreditAccount()) {
      return null;
    }

    const outstandingBalance = await this.calculateOutstandingBalance(
      accountId
    );
    const availableCredit = this.calculateAvailableCredit(
      account.creditLimit || 0,
      outstandingBalance
    );

    return {
      id: account.id,
      name: account.name,
      creditLimit: account.creditLimit || 0,
      billingDay: account.billingDay || 1,
      dueDay: account.dueDay || 1,
      outstandingBalance,
      availableCredit,
    };
  }

  /**
   * 检查是否超额
   */
  async isOverLimit(
    accountId: number,
    additionalAmount: number = 0
  ): Promise<boolean> {
    const account = await Account.findByPk(accountId);

    if (!account || !account.isCreditAccount()) {
      return false;
    }

    const outstandingBalance = await this.calculateOutstandingBalance(
      accountId
    );
    const newBalance = outstandingBalance + additionalAmount;
    const creditLimit = account.creditLimit || 0;

    return newBalance > creditLimit;
  }

  /**
   * 获取用户所有信用账户的待还金额汇总
   */
  async getUserCreditSummary(userId: number): Promise<{
    totalOutstanding: number;
    totalCreditLimit: number;
    totalAvailable: number;
    accounts: CreditAccountDetails[];
  }> {
    const creditAccounts = await Account.findAll({
      where: {
        userId,
        type: "credit",
      },
    });

    const accounts: CreditAccountDetails[] = [];
    let totalOutstanding = 0;
    let totalCreditLimit = 0;

    for (const account of creditAccounts) {
      const details = await this.getCreditAccountDetails(account.id);
      if (details) {
        accounts.push(details);
        totalOutstanding += details.outstandingBalance;
        totalCreditLimit += details.creditLimit;
      }
    }

    return {
      totalOutstanding,
      totalCreditLimit,
      totalAvailable: totalCreditLimit - totalOutstanding,
      accounts,
    };
  }

  /**
   * 计算距离还款日的天数
   */
  calculateDaysUntilDue(
    dueDay: number,
    currentDate: Date = new Date()
  ): number {
    const today = currentDate.getDate();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // 本月还款日
    let dueDate = new Date(currentYear, currentMonth, dueDay);

    // 如果今天已经过了还款日，计算到下个月还款日的天数
    if (today > dueDay) {
      dueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }

    const diffTime = dueDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * 判断是否逾期
   */
  isOverdue(dueDay: number, currentDate: Date = new Date()): boolean {
    const today = currentDate.getDate();
    return today > dueDay;
  }

  /**
   * 获取即将到期的还款提醒
   * 返回距离还款日不足 3 天且有待还金额的信用账户
   */
  async getDueReminders(
    userId: number,
    daysThreshold: number = 3
  ): Promise<DueReminder[]> {
    const creditAccounts = await Account.findAll({
      where: {
        userId,
        type: "credit",
      },
    });

    const reminders: DueReminder[] = [];
    const currentDate = new Date();

    for (const account of creditAccounts) {
      const outstandingBalance = await this.calculateOutstandingBalance(
        account.id
      );

      // 只有有待还金额的账户才需要提醒
      if (outstandingBalance <= 0) {
        continue;
      }

      const dueDay = account.dueDay || 1;
      const daysUntilDue = this.calculateDaysUntilDue(dueDay, currentDate);
      const isOverdue = this.isOverdue(dueDay, currentDate);

      // 距离还款日不足阈值天数，或已逾期
      if (daysUntilDue <= daysThreshold || isOverdue) {
        reminders.push({
          accountId: account.id,
          accountName: account.name,
          outstandingBalance,
          dueDay,
          daysUntilDue,
          isOverdue,
        });
      }
    }

    // 按紧急程度排序：逾期的排前面，然后按剩余天数升序
    reminders.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.daysUntilDue - b.daysUntilDue;
    });

    return reminders;
  }
}

export default new CreditService();
