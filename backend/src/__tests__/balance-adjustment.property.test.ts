/**
 * 快速平账功能属性测试
 * Feature: quick-balance
 */

import * as fc from "fast-check";
import balanceAdjustmentService from "../services/balanceAdjustment.service";

describe("BalanceAdjustmentService 属性测试", () => {
  /**
   * Property 1: 差额计算正确性
   * 对于任意当前余额和实际总额，差额应该等于 actualBalance - currentBalance
   * Validates: Requirements 1.1
   */
  describe("Property 1: 差额计算正确性", () => {
    it("差额应该等于 actualBalance - currentBalance", () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000000, max: 1000000, noNaN: true }),
          fc.double({ min: -1000000, max: 1000000, noNaN: true }),
          (actualBalance, currentBalance) => {
            const difference = balanceAdjustmentService.calculateDifference(
              actualBalance,
              currentBalance
            );
            const expected = actualBalance - currentBalance;
            // 使用近似比较，因为浮点数精度问题
            return Math.abs(difference - expected) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: 差额类型判断正确性
   * 对于任意差额值：
   * - 当差额 > 0 时，类型应为 'profit'
   * - 当差额 < 0 时，类型应为 'loss'
   * - 当差额 = 0 时，类型应为 'none'
   * Validates: Requirements 1.2, 1.3, 1.4
   */
  describe("Property 2: 差额类型判断正确性", () => {
    it("正数差额应返回 profit", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1000000, noNaN: true }),
          (positiveDifference) => {
            const type =
              balanceAdjustmentService.getDifferenceType(positiveDifference);
            return type === "profit";
          }
        ),
        { numRuns: 100 }
      );
    });

    it("负数差额应返回 loss", () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000000, max: -0.01, noNaN: true }),
          (negativeDifference) => {
            const type =
              balanceAdjustmentService.getDifferenceType(negativeDifference);
            return type === "loss";
          }
        ),
        { numRuns: 100 }
      );
    });

    it("零差额应返回 none", () => {
      const type = balanceAdjustmentService.getDifferenceType(0);
      expect(type).toBe("none");
    });
  });

  /**
   * Property 3 & 4: 平账后余额一致性和记录完整性
   * 这些属性需要数据库交互，在集成测试中验证
   * 这里只测试纯函数逻辑
   */
  describe("Property 3 & 4: 差额计算与类型的一致性", () => {
    it("计算差额后获取类型应该一致", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000000, noNaN: true }),
          fc.double({ min: 0, max: 1000000, noNaN: true }),
          (actualBalance, currentBalance) => {
            const difference = balanceAdjustmentService.calculateDifference(
              actualBalance,
              currentBalance
            );
            const type = balanceAdjustmentService.getDifferenceType(difference);

            // 验证类型与差额符号一致
            if (difference > 0) return type === "profit";
            if (difference < 0) return type === "loss";
            return type === "none";
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 边界情况测试
   */
  describe("边界情况", () => {
    it("相同余额应该差额为零", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000000, noNaN: true }),
          (balance) => {
            const difference = balanceAdjustmentService.calculateDifference(
              balance,
              balance
            );
            return Math.abs(difference) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("差额计算应该满足交换律的相反数关系", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000000, noNaN: true }),
          fc.double({ min: 0, max: 1000000, noNaN: true }),
          (a, b) => {
            const diff1 = balanceAdjustmentService.calculateDifference(a, b);
            const diff2 = balanceAdjustmentService.calculateDifference(b, a);
            // diff1 + diff2 应该接近 0
            return Math.abs(diff1 + diff2) < 0.001;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
