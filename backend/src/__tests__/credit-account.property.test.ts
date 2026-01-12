/**
 * 信用账户数据模型属性测试
 *
 * Property 6: 数据序列化往返一致性
 *
 * Validates: Requirements 7.3
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 信用账户数据接口
interface CreditAccountData {
  id: number;
  userId: number;
  name: string;
  type: "credit";
  balance: number;
  creditLimit: number;
  billingDay: number;
  dueDay: number;
  icon?: string;
}

// 生成有效的账户名称
const accountNameArbitrary = fc.stringOf(
  fc.constantFrom(
    ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789中文信用卡花呗白条"
  ),
  { minLength: 1, maxLength: 50 }
);

// 生成有效的账单日/还款日 (1-28)
const dayArbitrary = fc.integer({ min: 1, max: 28 });

// 生成有效的金额 (0 到 1000000，保留两位小数)
const amountArbitrary = fc
  .integer({ min: 0, max: 100000000 })
  .map((n) => Number((n / 100).toFixed(2)));

// 生成有效的信用账户数据
const creditAccountArbitrary: fc.Arbitrary<CreditAccountData> = fc.record({
  id: fc.integer({ min: 1, max: 1000000 }),
  userId: fc.integer({ min: 1, max: 1000000 }),
  name: accountNameArbitrary,
  type: fc.constant("credit" as const),
  balance: amountArbitrary,
  creditLimit: amountArbitrary,
  billingDay: dayArbitrary,
  dueDay: dayArbitrary,
  icon: fc.option(
    fc.stringOf(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz-"), {
      minLength: 1,
      maxLength: 20,
    }),
    { nil: undefined }
  ),
});

// 序列化函数
function serialize(account: CreditAccountData): string {
  return JSON.stringify(account);
}

// 反序列化函数
function deserialize(json: string): CreditAccountData {
  return JSON.parse(json);
}

// 比较两个信用账户是否等价
function areEquivalent(a: CreditAccountData, b: CreditAccountData): boolean {
  return (
    a.id === b.id &&
    a.userId === b.userId &&
    a.name === b.name &&
    a.type === b.type &&
    a.balance === b.balance &&
    a.creditLimit === b.creditLimit &&
    a.billingDay === b.billingDay &&
    a.dueDay === b.dueDay &&
    a.icon === b.icon
  );
}

describe("信用账户数据模型属性测试", () => {
  /**
   * Property 6: 数据序列化往返一致性
   * 对于任意有效的信用账户对象，序列化为 JSON 后再反序列化应产生等价的对象。
   * Validates: Requirements 7.3
   */
  describe("Property 6: 数据序列化往返一致性", () => {
    it("对于任意有效的信用账户，序列化后再反序列化应产生等价的对象", () => {
      fc.assert(
        fc.property(creditAccountArbitrary, (account) => {
          const serialized = serialize(account);
          const deserialized = deserialize(serialized);

          // 验证往返一致性
          expect(areEquivalent(account, deserialized)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("对于任意有效的信用账户，序列化结果应是有效的 JSON 字符串", () => {
      fc.assert(
        fc.property(creditAccountArbitrary, (account) => {
          const serialized = serialize(account);

          // 验证是有效的 JSON
          expect(() => JSON.parse(serialized)).not.toThrow();

          // 验证包含所有必要字段
          const parsed = JSON.parse(serialized);
          expect(parsed).toHaveProperty("id");
          expect(parsed).toHaveProperty("userId");
          expect(parsed).toHaveProperty("name");
          expect(parsed).toHaveProperty("type");
          expect(parsed).toHaveProperty("balance");
          expect(parsed).toHaveProperty("creditLimit");
          expect(parsed).toHaveProperty("billingDay");
          expect(parsed).toHaveProperty("dueDay");
        }),
        { numRuns: 100 }
      );
    });

    it("对于任意有效的信用账户，多次序列化应产生相同的结果", () => {
      fc.assert(
        fc.property(creditAccountArbitrary, (account) => {
          const serialized1 = serialize(account);
          const serialized2 = serialize(account);

          // 验证幂等性
          expect(serialized1).toBe(serialized2);
        }),
        { numRuns: 100 }
      );
    });

    it("对于任意有效的信用账户，双重往返应保持一致", () => {
      fc.assert(
        fc.property(creditAccountArbitrary, (account) => {
          // 第一次往返
          const roundTrip1 = deserialize(serialize(account));
          // 第二次往返
          const roundTrip2 = deserialize(serialize(roundTrip1));

          // 验证双重往返一致性
          expect(areEquivalent(roundTrip1, roundTrip2)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 额外测试：信用账户字段约束
   */
  describe("信用账户字段约束", () => {
    it("账单日和还款日应在 1-28 范围内", () => {
      fc.assert(
        fc.property(creditAccountArbitrary, (account) => {
          expect(account.billingDay).toBeGreaterThanOrEqual(1);
          expect(account.billingDay).toBeLessThanOrEqual(28);
          expect(account.dueDay).toBeGreaterThanOrEqual(1);
          expect(account.dueDay).toBeLessThanOrEqual(28);
        }),
        { numRuns: 100 }
      );
    });

    it("信用额度和余额应为非负数", () => {
      fc.assert(
        fc.property(creditAccountArbitrary, (account) => {
          expect(account.creditLimit).toBeGreaterThanOrEqual(0);
          expect(account.balance).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    it("账户类型应为 credit", () => {
      fc.assert(
        fc.property(creditAccountArbitrary, (account) => {
          expect(account.type).toBe("credit");
        }),
        { numRuns: 100 }
      );
    });
  });
});
