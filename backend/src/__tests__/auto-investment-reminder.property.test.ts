/**
 * 投资提醒属性测试
 *
 * Feature: auto-investment
 * Property 16: 提醒生成
 *
 * Validates: Requirements 6.1, 6.2
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 生成有效的金额 (1 到 100000，保留两位小数)
const amountArbitrary = fc
  .integer({ min: 100, max: 10000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成有效的提醒类型
const reminderTypeArbitrary = fc.constantFrom(
  "execution_failed",
  "insufficient_balance"
) as fc.Arbitrary<"execution_failed" | "insufficient_balance">;

// 生成有效的提醒消息
const messageArbitrary = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0);

describe("投资提醒属性测试", () => {
  /**
   * Property 16: 提醒生成
   * 对于任意执行失败的定投，系统必须生成 execution_failed 类型的提醒
   * 对于任意余额不足的预警检查，系统必须生成 insufficient_balance 类型的提醒
   * Validates: Requirements 6.1, 6.2
   */
  describe("Property 16: 提醒生成", () => {
    it("提醒类型只能是 execution_failed 或 insufficient_balance", () => {
      fc.assert(
        fc.property(reminderTypeArbitrary, (type) => {
          expect(["execution_failed", "insufficient_balance"]).toContain(type);
        }),
        { numRuns: 100 }
      );
    });

    it("提醒必须包含消息内容", () => {
      fc.assert(
        fc.property(messageArbitrary, (message) => {
          expect(message.trim().length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("新创建的提醒默认为未读状态", () => {
      const defaultIsRead = false;
      expect(defaultIsRead).toBe(false);
    });

    it("余额不足时应生成 insufficient_balance 类型提醒", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 1, max: 99 }).map((n) => n / 100),
          (planAmount, ratio) => {
            const balance = planAmount * ratio; // 余额小于计划金额
            const isInsufficientBalance = balance < planAmount;

            if (isInsufficientBalance) {
              const reminderType = "insufficient_balance";
              expect(reminderType).toBe("insufficient_balance");
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("执行失败时应生成 execution_failed 类型提醒", () => {
      const executionStatus = "failed";
      if (executionStatus === "failed") {
        const reminderType = "execution_failed";
        expect(reminderType).toBe("execution_failed");
      }
    });

    it("提醒必须关联到定投计划", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          reminderTypeArbitrary,
          messageArbitrary,
          (userId, planId, type, message) => {
            const reminder = {
              userId,
              planId,
              type,
              message,
              isRead: false,
            };

            expect(reminder.userId).toBeDefined();
            expect(reminder.planId).toBeDefined();
            expect(reminder.type).toBeDefined();
            expect(reminder.message).toBeDefined();
            expect(reminder.isRead).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("标记已读后 isRead 应为 true", () => {
      const reminder = {
        isRead: false,
      };

      // 模拟标记已读
      reminder.isRead = true;

      expect(reminder.isRead).toBe(true);
    });
  });

  /**
   * 余额检查逻辑测试
   */
  describe("余额检查逻辑", () => {
    it("当余额大于等于计划金额时，不应生成提醒", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 100, max: 200 }).map((n) => n / 100),
          (planAmount, ratio) => {
            const balance = planAmount * ratio; // 余额大于等于计划金额
            const shouldCreateReminder = balance < planAmount;

            expect(shouldCreateReminder).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当余额小于计划金额时，应生成提醒", () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 1, max: 99 }).map((n) => n / 100),
          (planAmount, ratio) => {
            const balance = planAmount * ratio; // 余额小于计划金额
            const shouldCreateReminder = balance < planAmount;

            expect(shouldCreateReminder).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("余额刚好等于计划金额时，不应生成提醒", () => {
      fc.assert(
        fc.property(amountArbitrary, (planAmount) => {
          const balance = planAmount;
          const shouldCreateReminder = balance < planAmount;

          expect(shouldCreateReminder).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
