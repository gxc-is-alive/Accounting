/**
 * 退款服务
 *
 * 处理退款相关的业务逻辑，包括：
 * - 计算可退款金额
 * - 获取退款信息
 * - 创建退款交易
 * - 删除退款交易
 */

import { Op } from "sequelize";
import { Transaction, Account, Category } from "../models";
import { AppError, ErrorCode } from "../utils/errors";
import { sequelize } from "../config/database";

// 退款错误码扩展
export const RefundErrorCode = {
  REFUND_ORIGINAL_NOT_FOUND: "REFUND_ORIGINAL_NOT_FOUND",
  REFUND_INVALID_TYPE: "REFUND_INVALID_TYPE",
  REFUND_AMOUNT_EXCEEDED: "REFUND_AMOUNT_EXCEEDED",
  REFUND_AMOUNT_INVALID: "REFUND_AMOUNT_INVALID",
  REFUND_ALREADY_FULL: "REFUND_ALREADY_FULL",
  REFUND_NOT_FOUND: "REFUND_NOT_FOUND",
} as const;

// 创建退款参数
export interface CreateRefundParams {
  userId: number;
  originalTransactionId: number;
  amount: number;
  date: string;
  note?: string;
}

// 退款信息
export interface RefundInfo {
  originalTransaction: Transaction;
  refunds: Transaction[];
  totalRefunded: number;
  refundableAmount: number;
}

// 退款结果
export interface RefundResult {
  refund: Transaction;
  originalTransaction: {
    id: number;
    amount: number;
    refundedAmount: number;
    refundableAmount: number;
  };
  accountBalance: number;
}

class RefundService {
  /**
   * 计算可退款金额
   * 可退款金额 = 原交易金额 - 已退款总额
   */
  async calculateRefundableAmount(
    transactionId: number,
    userId: number
  ): Promise<number> {
    // 获取原始交易
    const originalTransaction = await Transaction.findOne({
      where: { id: transactionId, userId },
    });

    if (!originalTransaction) {
      throw new AppError("原始交易不存在", 404, ErrorCode.NOT_FOUND);
    }

    // 获取所有关联的退款记录
    const refunds = await Transaction.findAll({
      where: {
        originalTransactionId: transactionId,
        type: "refund",
        userId,
      },
    });

    // 计算已退款总额
    const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);

    // 计算可退款金额
    const refundableAmount = Math.max(
      0,
      originalTransaction.amount - totalRefunded
    );

    return Number(refundableAmount.toFixed(2));
  }

  /**
   * 获取交易的退款信息
   */
  async getRefundInfo(
    transactionId: number,
    userId: number
  ): Promise<RefundInfo> {
    // 获取原始交易
    const originalTransaction = await Transaction.findOne({
      where: { id: transactionId, userId },
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

    if (!originalTransaction) {
      throw new AppError("原始交易不存在", 404, ErrorCode.NOT_FOUND);
    }

    // 获取所有关联的退款记录
    const refunds = await Transaction.findAll({
      where: {
        originalTransactionId: transactionId,
        type: "refund",
        userId,
      },
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
      order: [["createdAt", "DESC"]],
    });

    // 计算已退款总额
    const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);

    // 计算可退款金额
    const refundableAmount = Math.max(
      0,
      originalTransaction.amount - totalRefunded
    );

    return {
      originalTransaction,
      refunds,
      totalRefunded: Number(totalRefunded.toFixed(2)),
      refundableAmount: Number(refundableAmount.toFixed(2)),
    };
  }

  /**
   * 创建退款交易
   */
  async createRefund(params: CreateRefundParams): Promise<RefundResult> {
    const { userId, originalTransactionId, amount, date, note } = params;

    const t = await sequelize.transaction();

    try {
      // 1. 验证原始交易存在
      const originalTransaction = await Transaction.findOne({
        where: { id: originalTransactionId, userId },
        include: [
          {
            model: Account,
            as: "account",
          },
        ],
      });

      if (!originalTransaction) {
        throw new AppError("原始交易不存在", 404, ErrorCode.NOT_FOUND);
      }

      // 2. 验证原交易类型为支出
      if (originalTransaction.type !== "expense") {
        throw new AppError(
          "只能对支出交易进行退款",
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // 3. 验证退款金额为正数
      if (amount <= 0) {
        throw new AppError("退款金额必须为正数", 400, ErrorCode.INVALID_AMOUNT);
      }

      // 4. 计算可退款金额
      const refundableAmount = await this.calculateRefundableAmount(
        originalTransactionId,
        userId
      );

      // 5. 验证可退款金额不为零
      if (refundableAmount === 0) {
        throw new AppError("该交易已全额退款", 400, ErrorCode.VALIDATION_ERROR);
      }

      // 6. 验证退款金额不超过可退款金额
      if (amount > refundableAmount) {
        throw new AppError(
          `退款金额超过可退款金额，最多可退款 ${refundableAmount} 元`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      // 7. 获取退款分类（使用原交易的分类）
      const categoryId = originalTransaction.categoryId;

      // 8. 创建退款交易记录
      const refund = await Transaction.create(
        {
          userId,
          accountId: originalTransaction.accountId,
          categoryId,
          type: "refund",
          amount,
          date: new Date(date),
          note: note || `退款 - ${originalTransaction.note || ""}`.trim(),
          familyId: originalTransaction.familyId,
          isFamily: originalTransaction.isFamily,
          originalTransactionId,
        },
        { transaction: t }
      );

      // 9. 更新账户余额
      const account = await Account.findByPk(originalTransaction.accountId);
      if (!account) {
        throw new AppError("账户不存在", 404, ErrorCode.NOT_FOUND);
      }

      const isCreditAccount = account.isCreditAccount();

      if (!isCreditAccount) {
        // 非信用账户：退款增加余额
        await account.updateBalance(amount, t);
      }
      // 信用账户：退款减少待还金额（通过交易记录计算，不直接更新余额）

      await t.commit();

      // 10. 获取更新后的账户余额
      await account.reload();

      // 11. 计算新的退款信息
      const newRefundableAmount = refundableAmount - amount;
      const newRefundedAmount =
        originalTransaction.amount - newRefundableAmount;

      // 12. 获取完整的退款记录
      const fullRefund = await Transaction.findOne({
        where: { id: refund.id },
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

      return {
        refund: fullRefund!,
        originalTransaction: {
          id: originalTransaction.id,
          amount: originalTransaction.amount,
          refundedAmount: Number(newRefundedAmount.toFixed(2)),
          refundableAmount: Number(newRefundableAmount.toFixed(2)),
        },
        accountBalance: account.balance,
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * 删除退款交易
   */
  async deleteRefund(refundId: number, userId: number): Promise<void> {
    const t = await sequelize.transaction();

    try {
      // 1. 验证退款记录存在
      const refund = await Transaction.findOne({
        where: { id: refundId, userId, type: "refund" },
      });

      if (!refund) {
        throw new AppError("退款记录不存在", 404, ErrorCode.NOT_FOUND);
      }

      // 2. 获取账户
      const account = await Account.findByPk(refund.accountId);
      if (!account) {
        throw new AppError("账户不存在", 404, ErrorCode.NOT_FOUND);
      }

      // 3. 恢复账户余额（仅非信用账户）
      const isCreditAccount = account.isCreditAccount();
      if (!isCreditAccount) {
        // 非信用账户：删除退款时减少余额
        await account.updateBalance(-refund.amount, t);
      }
      // 信用账户：删除退款时增加待还金额（通过交易记录计算）

      // 4. 删除退款记录
      await refund.destroy({ transaction: t });

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * 更新退款交易
   */
  async updateRefund(
    refundId: number,
    userId: number,
    data: { amount?: number; date?: string; note?: string }
  ): Promise<Transaction> {
    const t = await sequelize.transaction();

    try {
      // 1. 验证退款记录存在
      const refund = await Transaction.findOne({
        where: { id: refundId, userId, type: "refund" },
      });

      if (!refund) {
        throw new AppError("退款记录不存在", 404, ErrorCode.NOT_FOUND);
      }

      // 2. 如果更新金额，需要重新验证
      if (data.amount !== undefined && data.amount !== refund.amount) {
        // 验证金额为正数
        if (data.amount <= 0) {
          throw new AppError(
            "退款金额必须为正数",
            400,
            ErrorCode.INVALID_AMOUNT
          );
        }

        // 计算可退款金额（不包括当前退款）
        const originalTransactionId = refund.originalTransactionId!;
        const otherRefunds = await Transaction.findAll({
          where: {
            originalTransactionId,
            type: "refund",
            userId,
            id: { [Op.ne]: refundId },
          },
        });

        const originalTransaction = await Transaction.findByPk(
          originalTransactionId
        );
        if (!originalTransaction) {
          throw new AppError("原始交易不存在", 404, ErrorCode.NOT_FOUND);
        }

        const otherRefundedAmount = otherRefunds.reduce(
          (sum, r) => sum + r.amount,
          0
        );
        const maxRefundableAmount =
          originalTransaction.amount - otherRefundedAmount;

        if (data.amount > maxRefundableAmount) {
          throw new AppError(
            `退款金额超过可退款金额，最多可退款 ${maxRefundableAmount.toFixed(
              2
            )} 元`,
            400,
            ErrorCode.VALIDATION_ERROR
          );
        }

        // 更新账户余额
        const account = await Account.findByPk(refund.accountId);
        if (account && !account.isCreditAccount()) {
          const balanceDiff = data.amount - refund.amount;
          await account.updateBalance(balanceDiff, t);
        }
      }

      // 3. 更新退款记录
      await refund.update(
        {
          amount: data.amount,
          date: data.date ? new Date(data.date) : undefined,
          note: data.note,
        },
        { transaction: t }
      );

      await t.commit();

      // 4. 返回更新后的退款记录
      const updatedRefund = await Transaction.findOne({
        where: { id: refundId },
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

      return updatedRefund!;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export default new RefundService();
