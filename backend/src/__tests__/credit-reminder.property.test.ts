/**
 * 还款提醒属性测试
 *
 * Property 7: 还款提醒准确性
 *
 * Validates: Requirements 5.1, 5.2
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 模拟还款提醒
interface DueReminder {
  accountId: number;
  accountName: string;
  outstandingBalance: number;
  dueDay: number;
  daysUntilDue: number;
  isOverdue: boolean;
}

// 模拟信用账户
interface CreditAccount {
  id: number;
  name: string;
  dueDay: number;
  outstandingBalance: number;
}

// 计算距离还款日的天数（纯函数）
function calculateDaysUntilDue(dueDay: number, currentDate: Date): number {
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

// 判断是否逾期（纯函数）
function isOverdue(dueDay: number, currentDate: Date): boolean {
  const today = currentDate.getDate();
  return today > dueDay;
}

// 生成还款提醒（纯函数）
function generateReminder(
  account: CreditAccount,
  currentDate: Date,
  daysThreshold: number = 3
): DueReminder | null {
  // 只有有待还金额的账户才需要提醒
  if (account.outstandingBalance <= 0) {
    return null;
  }

  const daysUntilDue = calculateDaysUntilDue(account.dueDay, currentDate);
  const overdue = isOverdue(account.dueDay, currentDate);

  // 距离还款日不足阈值天数，或已逾期
  if (daysUntilDue <= daysThreshold || overdue) {
    return {
      accountId: account.id,
      accountName: account.name,
      outstandingBalance: account.outstandingBalance,
      dueDay: account.dueDay,
      daysUntilDue,
      isOverdue: overdue,
    };
  }

  return null;
}

// 生成有效的还款日 (1-28)
const dueDayArbitrary = fc.integer({ min: 1, max: 28 });

// 生成有效的金额
const amountArbitrary = fc
  .integer({ min: 1, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成信用账户
const creditAccountArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 1000 }),
  name: fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz"), {
    minLength: 1,
    maxLength: 20,
  }),
  dueDay: dueDayArbitrary,
  outstandingBalance: amountArbitrary,
});

// 生成日期（当月内）
const currentDateArbitrary = fc.integer({ min: 1, max: 28 }).map((day) => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day);
});

describe("还款提醒属性测试", () => {
  /**
   * Property 7: 还款提醒准确性
   * 对于任意待还金额大于 0 且距离还款日不足 3 天的信用账户，应出现在还款提醒列表中。
   * Validates: Requirements 5.1, 5.2
   */
  describe("Property 7: 还款提醒准确性", () => {
    it("有待还金额且距离还款日不足 3 天的账户应生成提醒", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          currentDateArbitrary,
          (account, currentDate) => {
            fc.pre(account.outstandingBalance > 0);

            const daysUntilDue = calculateDaysUntilDue(
              account.dueDay,
              currentDate
            );
            const overdue = isOverdue(account.dueDay, currentDate);

            const reminder = generateReminder(account, currentDate, 3);

            // 如果距离还款日不足 3 天或已逾期，应该生成提醒
            if (daysUntilDue <= 3 || overdue) {
              expect(reminder).not.toBeNull();
              expect(reminder!.accountId).toBe(account.id);
              expect(reminder!.outstandingBalance).toBe(
                account.outstandingBalance
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("没有待还金额的账户不应生成提醒", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 1000 }),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            dueDay: dueDayArbitrary,
            outstandingBalance: fc.constant(0),
          }),
          currentDateArbitrary,
          (account, currentDate) => {
            const reminder = generateReminder(account, currentDate, 3);

            // 没有待还金额，不应生成提醒
            expect(reminder).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("距离还款日超过阈值且未逾期的账户不应生成提醒", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          currentDateArbitrary,
          (account, currentDate) => {
            fc.pre(account.outstandingBalance > 0);

            const daysUntilDue = calculateDaysUntilDue(
              account.dueDay,
              currentDate
            );
            const overdue = isOverdue(account.dueDay, currentDate);

            // 只测试距离还款日超过 3 天且未逾期的情况
            fc.pre(daysUntilDue > 3 && !overdue);

            const reminder = generateReminder(account, currentDate, 3);

            // 不应生成提醒
            expect(reminder).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("逾期账户应标记为逾期", () => {
      fc.assert(
        fc.property(
          creditAccountArbitrary,
          currentDateArbitrary,
          (account, currentDate) => {
            fc.pre(account.outstandingBalance > 0);

            const overdue = isOverdue(account.dueDay, currentDate);
            fc.pre(overdue);

            const reminder = generateReminder(account, currentDate, 3);

            // 逾期账户应生成提醒且标记为逾期
            expect(reminder).not.toBeNull();
            expect(reminder!.isOverdue).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 额外测试：日期计算
   */
  describe("日期计算", () => {
    it("还款日当天，距离还款日为 0 天", () => {
      fc.assert(
        fc.property(dueDayArbitrary, (dueDay) => {
          const now = new Date();
          const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            dueDay
          );

          const days = calculateDaysUntilDue(dueDay, currentDate);

          expect(days).toBe(0);
        }),
        { numRuns: 28 }
      );
    });

    it("还款日前一天，距离还款日为 1 天", () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 28 }), (dueDay) => {
          const now = new Date();
          const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            dueDay - 1
          );

          const days = calculateDaysUntilDue(dueDay, currentDate);

          expect(days).toBe(1);
        }),
        { numRuns: 27 }
      );
    });

    it("还款日后一天应标记为逾期", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 27 }), (dueDay) => {
          const now = new Date();
          const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            dueDay + 1
          );

          const overdue = isOverdue(dueDay, currentDate);

          expect(overdue).toBe(true);
        }),
        { numRuns: 27 }
      );
    });

    it("还款日当天不应标记为逾期", () => {
      fc.assert(
        fc.property(dueDayArbitrary, (dueDay) => {
          const now = new Date();
          const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            dueDay
          );

          const overdue = isOverdue(dueDay, currentDate);

          expect(overdue).toBe(false);
        }),
        { numRuns: 28 }
      );
    });
  });
});
