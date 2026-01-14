/**
 * 定投调度器属性测试
 * 验证调度器触发逻辑的正确性
 */

import * as fc from "fast-check";

describe("定投调度器属性测试", () => {
  describe("Property 8: 调度器触发", () => {
    // 模拟计划状态
    type PlanStatus = "active" | "paused" | "deleted";

    interface MockPlan {
      id: number;
      status: PlanStatus;
      nextExecutionDate: string;
      executionTime: string;
    }

    // 判断计划是否应该被执行
    const shouldExecutePlan = (
      plan: MockPlan,
      currentDate: string,
      currentTime: string
    ): boolean => {
      // 只有 active 状态的计划才能被执行
      if (plan.status !== "active") {
        return false;
      }
      // 执行日期必须到达
      if (plan.nextExecutionDate > currentDate) {
        return false;
      }
      // 执行时间必须匹配
      if (plan.executionTime !== currentTime) {
        return false;
      }
      return true;
    };

    it("active 状态且到达执行时间的计划应该被触发", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.constantFrom("2025-01-15", "2025-02-28", "2025-12-31"),
          fc.constantFrom("09:00", "12:00", "18:00"),
          (planId, date, time) => {
            const plan: MockPlan = {
              id: planId,
              status: "active",
              nextExecutionDate: date,
              executionTime: time,
            };

            // 当前日期等于或晚于执行日期，且时间匹配
            const result = shouldExecutePlan(plan, date, time);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("paused 状态的计划不应该被触发", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.constantFrom("2025-01-15", "2025-02-28", "2025-12-31"),
          fc.constantFrom("09:00", "12:00", "18:00"),
          (planId, date, time) => {
            const plan: MockPlan = {
              id: planId,
              status: "paused",
              nextExecutionDate: date,
              executionTime: time,
            };

            const result = shouldExecutePlan(plan, date, time);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("deleted 状态的计划不应该被触发", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.constantFrom("2025-01-15", "2025-02-28", "2025-12-31"),
          fc.constantFrom("09:00", "12:00", "18:00"),
          (planId, date, time) => {
            const plan: MockPlan = {
              id: planId,
              status: "deleted",
              nextExecutionDate: date,
              executionTime: time,
            };

            const result = shouldExecutePlan(plan, date, time);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("执行日期未到的计划不应该被触发", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.constantFrom("09:00", "12:00", "18:00"),
          (planId, time) => {
            const plan: MockPlan = {
              id: planId,
              status: "active",
              nextExecutionDate: "2025-12-31", // 未来日期
              executionTime: time,
            };

            // 当前日期早于执行日期
            const result = shouldExecutePlan(plan, "2025-01-01", time);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("执行时间不匹配的计划不应该被触发", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.constantFrom("2025-01-15", "2025-02-28"),
          (planId, date) => {
            const plan: MockPlan = {
              id: planId,
              status: "active",
              nextExecutionDate: date,
              executionTime: "09:00",
            };

            // 当前时间不匹配
            const result = shouldExecutePlan(plan, date, "10:00");
            expect(result).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("调度器时间匹配", () => {
    // 时间格式验证
    const isValidTimeFormat = (time: string): boolean => {
      const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      return regex.test(time);
    };

    it("执行时间格式必须是 HH:mm", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 }),
          (hours, minutes) => {
            const time = `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}`;
            expect(isValidTimeFormat(time)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("无效的时间格式应该被拒绝", () => {
      const invalidTimes = [
        "9:00", // 缺少前导零
        "25:00", // 小时超出范围
        "12:60", // 分钟超出范围
        "12-00", // 错误分隔符
        "1200", // 缺少分隔符
        "", // 空字符串
      ];

      for (const time of invalidTimes) {
        expect(isValidTimeFormat(time)).toBe(false);
      }
    });
  });

  describe("日期比较逻辑", () => {
    // 日期比较函数
    const isDateReached = (
      nextExecutionDate: string,
      currentDate: string
    ): boolean => {
      return nextExecutionDate <= currentDate;
    };

    it("当前日期等于执行日期时应该触发", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "2025-01-01",
            "2025-06-15",
            "2025-12-31",
            "2024-02-29"
          ),
          (date) => {
            expect(isDateReached(date, date)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it("当前日期晚于执行日期时应该触发", () => {
      const testCases = [
        { execution: "2025-01-01", current: "2025-01-02" },
        { execution: "2025-01-15", current: "2025-02-01" },
        { execution: "2024-12-31", current: "2025-01-01" },
      ];

      for (const { execution, current } of testCases) {
        expect(isDateReached(execution, current)).toBe(true);
      }
    });

    it("当前日期早于执行日期时不应该触发", () => {
      const testCases = [
        { execution: "2025-01-02", current: "2025-01-01" },
        { execution: "2025-02-01", current: "2025-01-15" },
        { execution: "2025-01-01", current: "2024-12-31" },
      ];

      for (const { execution, current } of testCases) {
        expect(isDateReached(execution, current)).toBe(false);
      }
    });
  });
});
