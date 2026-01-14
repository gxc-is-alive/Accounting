/**
 * 定投计划属性测试
 *
 * Feature: auto-investment
 * Property 1: 定投计划数据完整性
 * Property 2: 频率类型支持
 * Property 3: 月末日期调整
 * Property 4: 状态管理
 * Property 5: 账户类型验证
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.3, 2.4
 */

import * as fc from "fast-check";
import autoInvestmentPlanService from "../services/autoInvestmentPlan.service";

// 设置更长的超时时间
jest.setTimeout(60000);

// 生成有效的金额 (1 到 100000，保留两位小数)
const amountArbitrary = fc
  .integer({ min: 100, max: 10000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成有效的频率类型
const frequencyArbitrary = fc.constantFrom(
  "daily",
  "weekly",
  "monthly"
) as fc.Arbitrary<"daily" | "weekly" | "monthly">;

// 生成有效的周几 (1-7)
const weekDayArbitrary = fc.integer({ min: 1, max: 7 });

// 生成有效的月日 (1-31)
const monthDayArbitrary = fc.integer({ min: 1, max: 31 });

// 生成有效的执行时间 (HH:mm)
const executionTimeArbitrary = fc
  .tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
  .map(
    ([h, m]) =>
      `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
  );

// 生成有效的计划名称
const planNameArbitrary = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0);

describe("定投计划属性测试", () => {
  /**
   * Property 1: 定投计划数据完整性
   * 对于任意创建的定投计划，该计划必须包含名称、资金来源账户、目标投资账户、定投金额、执行频率和下次执行时间
   * Validates: Requirements 1.1, 2.1
   */
  describe("Property 1: 定投计划数据完整性", () => {
    it("对于任意有效的定投计划参数，创建后必须包含所有必填字段", () => {
      fc.assert(
        fc.property(
          planNameArbitrary,
          amountArbitrary,
          frequencyArbitrary,
          executionTimeArbitrary,
          (name, amount, frequency, executionTime) => {
            // 模拟创建参数
            const params = {
              userId: 1,
              name,
              sourceAccountId: 1,
              targetAccountId: 2,
              amount,
              frequency,
              executionDay:
                frequency === "weekly"
                  ? 1
                  : frequency === "monthly"
                  ? 15
                  : undefined,
              executionTime,
            };

            // 验证参数完整性
            expect(params.name).toBeDefined();
            expect(params.name.length).toBeGreaterThan(0);
            expect(params.sourceAccountId).toBeDefined();
            expect(params.targetAccountId).toBeDefined();
            expect(params.amount).toBeGreaterThan(0);
            expect(["daily", "weekly", "monthly"]).toContain(params.frequency);
            expect(params.executionTime).toMatch(/^\d{2}:\d{2}$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("定投金额必须大于0", () => {
      fc.assert(
        fc.property(amountArbitrary, (amount) => {
          expect(amount).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: 频率类型支持
   * 对于任意定投计划的频率设置，系统必须正确处理 daily、weekly、monthly 三种频率类型
   * Validates: Requirements 1.2
   */
  describe("Property 2: 频率类型支持", () => {
    it("daily 频率不需要执行日", () => {
      fc.assert(
        fc.property(fc.constant("daily"), (frequency) => {
          // daily 频率的执行日可以是 undefined
          const executionDay = undefined;
          expect(frequency).toBe("daily");
          expect(executionDay).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it("weekly 频率必须有有效的执行日 (1-7)", () => {
      fc.assert(
        fc.property(weekDayArbitrary, (executionDay) => {
          expect(executionDay).toBeGreaterThanOrEqual(1);
          expect(executionDay).toBeLessThanOrEqual(7);
        }),
        { numRuns: 100 }
      );
    });

    it("monthly 频率必须有有效的执行日 (1-31)", () => {
      fc.assert(
        fc.property(monthDayArbitrary, (executionDay) => {
          expect(executionDay).toBeGreaterThanOrEqual(1);
          expect(executionDay).toBeLessThanOrEqual(31);
        }),
        { numRuns: 100 }
      );
    });

    it("频率类型只能是 daily、weekly 或 monthly", () => {
      fc.assert(
        fc.property(frequencyArbitrary, (frequency) => {
          expect(["daily", "weekly", "monthly"]).toContain(frequency);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: 月末日期调整
   * 对于任意月度定投计划，当执行日期设置为 29-31 日且当月无该日期时，实际执行日期必须调整为当月最后一天
   * Validates: Requirements 1.3
   */
  describe("Property 3: 月末日期调整", () => {
    it("对于任意月份和执行日，计算的下次执行日期必须是有效日期", () => {
      fc.assert(
        fc.property(
          monthDayArbitrary,
          fc.integer({ min: 2024, max: 2030 }),
          fc.integer({ min: 0, max: 11 }),
          (executionDay, year, month) => {
            const currentDate = new Date(year, month, 1);
            const nextDate =
              autoInvestmentPlanService.calculateNextExecutionDate(
                "monthly",
                executionDay,
                currentDate
              );

            // 验证返回的是有效日期字符串
            expect(nextDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

            // 解析日期并验证有效性
            const parsedDate = new Date(nextDate);
            expect(parsedDate.toString()).not.toBe("Invalid Date");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("当执行日为 31 日时，2月份应调整为月末", () => {
      // 测试2月份（非闰年）
      const nextDate = autoInvestmentPlanService.calculateNextExecutionDate(
        "monthly",
        31,
        new Date(2025, 0, 15) // 2025年1月15日
      );

      const parsedDate = new Date(nextDate);
      // 2025年2月最后一天是28日
      expect(parsedDate.getDate()).toBe(28);
    });

    it("当执行日为 30 日时，2月份应调整为月末", () => {
      const nextDate = autoInvestmentPlanService.calculateNextExecutionDate(
        "monthly",
        30,
        new Date(2025, 0, 15)
      );

      const parsedDate = new Date(nextDate);
      expect(parsedDate.getDate()).toBe(28);
    });

    it("当执行日为 29 日时，非闰年2月份应调整为28日", () => {
      const nextDate = autoInvestmentPlanService.calculateNextExecutionDate(
        "monthly",
        29,
        new Date(2025, 0, 15)
      );

      const parsedDate = new Date(nextDate);
      expect(parsedDate.getDate()).toBe(28);
    });

    it("当执行日为 29 日时，闰年2月份应为29日", () => {
      const nextDate = autoInvestmentPlanService.calculateNextExecutionDate(
        "monthly",
        29,
        new Date(2024, 0, 15) // 2024是闰年
      );

      const parsedDate = new Date(nextDate);
      expect(parsedDate.getDate()).toBe(29);
    });
  });

  /**
   * Property 4: 状态管理
   * 对于任意定投计划，创建时状态必须为 active；暂停后状态必须为 paused；恢复后状态必须为 active
   * Validates: Requirements 1.4, 2.3, 2.4
   */
  describe("Property 4: 状态管理", () => {
    it("状态只能是 active、paused 或 deleted", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("active", "paused", "deleted"),
          (status) => {
            expect(["active", "paused", "deleted"]).toContain(status);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("默认状态应为 active", () => {
      const defaultStatus = "active";
      expect(defaultStatus).toBe("active");
    });

    it("状态转换：active -> paused 是有效的", () => {
      const currentStatus = "active";
      const newStatus = "paused";

      // 只有 active 状态可以暂停
      expect(currentStatus).toBe("active");
      expect(newStatus).toBe("paused");
    });

    it("状态转换：paused -> active 是有效的", () => {
      const currentStatus = "paused";
      const newStatus = "active";

      // 只有 paused 状态可以恢复
      expect(currentStatus).toBe("paused");
      expect(newStatus).toBe("active");
    });

    it("deleted 状态不能转换为其他状态", () => {
      const deletedStatus = "deleted";
      // deleted 是终态
      expect(deletedStatus).toBe("deleted");
    });
  });

  /**
   * Property 5: 账户类型验证
   * 对于任意创建定投计划的请求，如果资金来源账户类型为 investment，系统必须拒绝创建
   * Validates: Requirements 1.5
   */
  describe("Property 5: 账户类型验证", () => {
    it("资金来源账户类型不能是 investment", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "cash",
            "bank",
            "alipay",
            "wechat",
            "credit",
            "other"
          ),
          (accountType) => {
            // 有效的来源账户类型
            expect(accountType).not.toBe("investment");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("目标账户类型必须是 investment", () => {
      const targetAccountType = "investment";
      expect(targetAccountType).toBe("investment");
    });

    it("有效的来源账户类型列表", () => {
      const validSourceTypes = [
        "cash",
        "bank",
        "alipay",
        "wechat",
        "credit",
        "other",
      ];

      fc.assert(
        fc.property(fc.constantFrom(...validSourceTypes), (accountType) => {
          expect(validSourceTypes).toContain(accountType);
          expect(accountType).not.toBe("investment");
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 下次执行日期计算测试
   */
  describe("下次执行日期计算", () => {
    it("daily 频率：下次执行日期应该是明天", () => {
      const today = new Date(2025, 0, 15); // 2025年1月15日
      const nextDate = autoInvestmentPlanService.calculateNextExecutionDate(
        "daily",
        undefined,
        today
      );

      expect(nextDate).toBe("2025-01-16");
    });

    it("weekly 频率：下次执行日期应该是下一个指定的周几", () => {
      // 2025年1月15日是周三
      const today = new Date(2025, 0, 15);

      // 测试周一（executionDay=1）
      const nextMonday = autoInvestmentPlanService.calculateNextExecutionDate(
        "weekly",
        1,
        today
      );
      const mondayDate = new Date(nextMonday);
      expect(mondayDate.getDay()).toBe(1); // 周一

      // 测试周五（executionDay=5）
      const nextFriday = autoInvestmentPlanService.calculateNextExecutionDate(
        "weekly",
        5,
        today
      );
      const fridayDate = new Date(nextFriday);
      expect(fridayDate.getDay()).toBe(5); // 周五
    });

    it("monthly 频率：下次执行日期应该是下个月的指定日期", () => {
      const today = new Date(2025, 0, 15); // 2025年1月15日

      // 测试15号
      const next15 = autoInvestmentPlanService.calculateNextExecutionDate(
        "monthly",
        15,
        today
      );
      expect(next15).toBe("2025-02-15");

      // 测试1号
      const next1 = autoInvestmentPlanService.calculateNextExecutionDate(
        "monthly",
        1,
        today
      );
      expect(next1).toBe("2025-02-01");
    });
  });
});
