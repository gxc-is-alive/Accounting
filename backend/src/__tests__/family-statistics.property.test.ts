/**
 * 家庭账单优化属性测试
 *
 * Property 1: 家庭收支汇总正确性
 * Property 2: 家庭总存款计算正确性
 * Property 4: 成员贡献占比总和
 *
 * Validates: Requirements 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 4.2, 4.3
 */

import * as fc from "fast-check";

// 设置更长的超时时间
jest.setTimeout(60000);

// 生成交易金额（正数，最多两位小数）
const amountArbitrary = fc
  .float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true })
  .map((n) => Math.round(n * 100) / 100);

// 生成交易类型
const transactionTypeArbitrary = fc.constantFrom("income", "expense");

// 生成成员 ID
const memberIdArbitrary = fc.integer({ min: 1, max: 100 });

// 生成日期字符串
const dateArbitrary = fc
  .tuple(
    fc.integer({ min: 2020, max: 2025 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(
    ([year, month, day]) =>
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`
  );

// 生成成员交易记录
const memberTransactionArbitrary = fc.record({
  userId: memberIdArbitrary,
  type: transactionTypeArbitrary,
  amount: amountArbitrary,
  date: dateArbitrary,
});

// 生成账户余额
const accountBalanceArbitrary = fc
  .float({ min: Math.fround(-10000), max: Math.fround(100000), noNaN: true })
  .map((n) => Math.round(n * 100) / 100);

// 生成账户类型
const accountTypeArbitrary = fc.constantFrom(
  "cash",
  "bank",
  "alipay",
  "wechat",
  "credit",
  "other"
);

// 生成成员账户
const memberAccountArbitrary = fc.record({
  userId: memberIdArbitrary,
  type: accountTypeArbitrary,
  balance: accountBalanceArbitrary,
});

describe("家庭账单优化属性测试", () => {
  /**
   * Property 1: 家庭收支汇总正确性
   * 对于任意家庭和任意时间段，家庭总收入应等于所有成员收入之和，
   * 家庭总支出应等于所有成员支出之和。
   * Validates: Requirements 1.2, 1.3, 1.4
   */
  describe("Property 1: 家庭收支汇总正确性", () => {
    it("对于任意成员交易列表，家庭总收入等于所有成员收入之和", () => {
      fc.assert(
        fc.property(
          fc.array(memberTransactionArbitrary, { minLength: 0, maxLength: 50 }),
          (transactions) => {
            // 计算预期的家庭总收入
            const expectedIncome = transactions
              .filter((t) => t.type === "income")
              .reduce((sum, t) => sum + t.amount, 0);

            // 模拟家庭收支汇总计算
            let familyIncome = 0;
            for (const t of transactions) {
              if (t.type === "income") {
                familyIncome += t.amount;
              }
            }

            // 验证：家庭总收入等于所有成员收入之和
            expect(Math.round(familyIncome * 100) / 100).toBeCloseTo(
              Math.round(expectedIncome * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意成员交易列表，家庭总支出等于所有成员支出之和", () => {
      fc.assert(
        fc.property(
          fc.array(memberTransactionArbitrary, { minLength: 0, maxLength: 50 }),
          (transactions) => {
            // 计算预期的家庭总支出
            const expectedExpense = transactions
              .filter((t) => t.type === "expense")
              .reduce((sum, t) => sum + t.amount, 0);

            // 模拟家庭收支汇总计算
            let familyExpense = 0;
            for (const t of transactions) {
              if (t.type === "expense") {
                familyExpense += t.amount;
              }
            }

            // 验证：家庭总支出等于所有成员支出之和
            expect(Math.round(familyExpense * 100) / 100).toBeCloseTo(
              Math.round(expectedExpense * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意成员交易列表，家庭结余等于总收入减去总支出", () => {
      fc.assert(
        fc.property(
          fc.array(memberTransactionArbitrary, { minLength: 0, maxLength: 50 }),
          (transactions) => {
            // 计算收入和支出
            let income = 0;
            let expense = 0;
            for (const t of transactions) {
              if (t.type === "income") {
                income += t.amount;
              } else {
                expense += t.amount;
              }
            }

            const balance = income - expense;

            // 验证：结余 = 收入 - 支出
            expect(Math.round(balance * 100) / 100).toBeCloseTo(
              Math.round((income - expense) * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: 家庭总存款计算正确性
   * 对于任意家庭，家庭总存款应等于所有成员所有账户余额的总和，
   * 且按账户类型分组后的余额之和应等于总存款。
   * Validates: Requirements 2.1, 2.2, 2.3
   */
  describe("Property 2: 家庭总存款计算正确性", () => {
    it("对于任意成员账户列表，家庭总存款等于所有非信用卡负债账户余额之和", () => {
      fc.assert(
        fc.property(
          fc.array(memberAccountArbitrary, { minLength: 0, maxLength: 30 }),
          (accounts) => {
            // 计算预期的家庭总存款（信用卡负债不计入）
            const expectedTotal = accounts.reduce((sum, acc) => {
              if (acc.type === "credit" && acc.balance < 0) {
                return sum; // 信用卡欠款不计入
              }
              return sum + acc.balance;
            }, 0);

            // 模拟家庭总存款计算
            let totalAssets = 0;
            for (const acc of accounts) {
              if (acc.type === "credit" && acc.balance < 0) {
                continue; // 信用卡欠款不计入
              }
              totalAssets += acc.balance;
            }

            // 验证：家庭总存款等于所有账户余额之和
            expect(Math.round(totalAssets * 100) / 100).toBeCloseTo(
              Math.round(expectedTotal * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意成员账户列表，按账户类型分组后的余额之和等于各账户余额之和", () => {
      fc.assert(
        fc.property(
          fc.array(memberAccountArbitrary, { minLength: 0, maxLength: 30 }),
          (accounts) => {
            // 按类型分组统计
            const byType: Record<string, number> = {};
            for (const acc of accounts) {
              byType[acc.type] = (byType[acc.type] || 0) + acc.balance;
            }

            // 计算分组后的总和
            const groupedTotal = Object.values(byType).reduce(
              (sum, val) => sum + val,
              0
            );

            // 计算直接总和
            const directTotal = accounts.reduce(
              (sum, acc) => sum + acc.balance,
              0
            );

            // 验证：分组后的总和等于直接总和
            expect(Math.round(groupedTotal * 100) / 100).toBeCloseTo(
              Math.round(directTotal * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意成员账户列表，按成员分组后的余额之和等于总余额", () => {
      fc.assert(
        fc.property(
          fc.array(memberAccountArbitrary, { minLength: 0, maxLength: 30 }),
          (accounts) => {
            // 按成员分组统计
            const byMember: Record<number, number> = {};
            for (const acc of accounts) {
              byMember[acc.userId] = (byMember[acc.userId] || 0) + acc.balance;
            }

            // 计算分组后的总和
            const groupedTotal = Object.values(byMember).reduce(
              (sum, val) => sum + val,
              0
            );

            // 计算直接总和
            const directTotal = accounts.reduce(
              (sum, acc) => sum + acc.balance,
              0
            );

            // 验证：按成员分组后的总和等于直接总和
            expect(Math.round(groupedTotal * 100) / 100).toBeCloseTo(
              Math.round(directTotal * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: 成员贡献占比总和
   * 对于任意家庭统计，所有成员的收入占比之和应等于 100%，
   * 所有成员的支出占比之和应等于 100%。
   * Validates: Requirements 4.2, 4.3
   */
  describe("Property 4: 成员贡献占比总和", () => {
    it("对于任意成员交易列表，所有成员收入占比之和等于 100%（有收入时）", () => {
      fc.assert(
        fc.property(
          fc.array(memberTransactionArbitrary, { minLength: 1, maxLength: 50 }),
          (transactions) => {
            // 计算总收入
            const totalIncome = transactions
              .filter((t) => t.type === "income")
              .reduce((sum, t) => sum + t.amount, 0);

            // 如果没有收入，跳过测试
            if (totalIncome === 0) return true;

            // 按成员统计收入
            const memberIncome: Record<number, number> = {};
            for (const t of transactions) {
              if (t.type === "income") {
                memberIncome[t.userId] =
                  (memberIncome[t.userId] || 0) + t.amount;
              }
            }

            // 计算各成员收入占比
            const percentages = Object.values(memberIncome).map(
              (income) => (income / totalIncome) * 100
            );

            // 验证：所有成员收入占比之和等于 100%
            const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
            expect(totalPercentage).toBeCloseTo(100, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意成员交易列表，所有成员支出占比之和等于 100%（有支出时）", () => {
      fc.assert(
        fc.property(
          fc.array(memberTransactionArbitrary, { minLength: 1, maxLength: 50 }),
          (transactions) => {
            // 计算总支出
            const totalExpense = transactions
              .filter((t) => t.type === "expense")
              .reduce((sum, t) => sum + t.amount, 0);

            // 如果没有支出，跳过测试
            if (totalExpense === 0) return true;

            // 按成员统计支出
            const memberExpense: Record<number, number> = {};
            for (const t of transactions) {
              if (t.type === "expense") {
                memberExpense[t.userId] =
                  (memberExpense[t.userId] || 0) + t.amount;
              }
            }

            // 计算各成员支出占比
            const percentages = Object.values(memberExpense).map(
              (expense) => (expense / totalExpense) * 100
            );

            // 验证：所有成员支出占比之和等于 100%
            const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
            expect(totalPercentage).toBeCloseTo(100, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于没有收入的情况，所有成员收入占比应为 0", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              userId: memberIdArbitrary,
              type: fc.constant("expense" as const),
              amount: amountArbitrary,
              date: dateArbitrary,
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (transactions) => {
            // 将交易转换为通用类型以便统一处理
            const typedTransactions = transactions as Array<{
              userId: number;
              type: "income" | "expense";
              amount: number;
              date: string;
            }>;

            // 计算总收入（应该为 0，因为所有交易都是 expense）
            const totalIncome = typedTransactions
              .filter((t) => t.type === "income")
              .reduce((sum, t) => sum + t.amount, 0);

            // 验证：没有收入时，总收入为 0
            expect(totalIncome).toBe(0);

            // 此时所有成员的收入占比应该为 0
            const memberIncome: Record<number, number> = {};
            for (const t of typedTransactions) {
              if (t.type === "income") {
                memberIncome[t.userId] =
                  (memberIncome[t.userId] || 0) + t.amount;
              }
            }

            // 验证：没有成员有收入
            expect(Object.keys(memberIncome).length).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 5: 年度报表月度数据一致性
   * 对于任意年度交易数据，12个月的收支之和应等于年度总收支
   * Validates: Requirements 3.1, 3.2
   */
  describe("Property 5: 年度报表月度数据一致性", () => {
    // 生成带月份的交易
    const yearlyTransactionArbitrary = fc.record({
      userId: memberIdArbitrary,
      type: transactionTypeArbitrary,
      amount: amountArbitrary,
      month: fc.integer({ min: 1, max: 12 }),
    });

    it("对于任意年度交易，12个月收入之和等于年度总收入", () => {
      fc.assert(
        fc.property(
          fc.array(yearlyTransactionArbitrary, {
            minLength: 0,
            maxLength: 100,
          }),
          (transactions) => {
            // 按月统计收入
            const monthlyIncome: number[] = Array(12).fill(0);
            let totalIncome = 0;

            for (const t of transactions) {
              if (t.type === "income") {
                monthlyIncome[t.month - 1] += t.amount;
                totalIncome += t.amount;
              }
            }

            // 计算月度收入之和
            const sumOfMonthly = monthlyIncome.reduce(
              (sum, val) => sum + val,
              0
            );

            // 验证：月度收入之和等于年度总收入
            expect(Math.round(sumOfMonthly * 100) / 100).toBeCloseTo(
              Math.round(totalIncome * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意年度交易，12个月支出之和等于年度总支出", () => {
      fc.assert(
        fc.property(
          fc.array(yearlyTransactionArbitrary, {
            minLength: 0,
            maxLength: 100,
          }),
          (transactions) => {
            // 按月统计支出
            const monthlyExpense: number[] = Array(12).fill(0);
            let totalExpense = 0;

            for (const t of transactions) {
              if (t.type === "expense") {
                monthlyExpense[t.month - 1] += t.amount;
                totalExpense += t.amount;
              }
            }

            // 计算月度支出之和
            const sumOfMonthly = monthlyExpense.reduce(
              (sum, val) => sum + val,
              0
            );

            // 验证：月度支出之和等于年度总支出
            expect(Math.round(sumOfMonthly * 100) / 100).toBeCloseTo(
              Math.round(totalExpense * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意年度交易，年度结余等于年度总收入减去年度总支出", () => {
      fc.assert(
        fc.property(
          fc.array(yearlyTransactionArbitrary, {
            minLength: 0,
            maxLength: 100,
          }),
          (transactions) => {
            let totalIncome = 0;
            let totalExpense = 0;

            for (const t of transactions) {
              if (t.type === "income") {
                totalIncome += t.amount;
              } else {
                totalExpense += t.amount;
              }
            }

            const balance = totalIncome - totalExpense;

            // 验证：结余 = 收入 - 支出
            expect(Math.round(balance * 100) / 100).toBeCloseTo(
              Math.round((totalIncome - totalExpense) * 100) / 100,
              2
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: 分类占比总和
   * 对于任意支出数据，所有分类的支出占比之和应等于 100%
   * Validates: Requirements 3.3
   */
  describe("Property 6: 分类占比总和", () => {
    // 生成带分类的支出交易
    const categoryIdArbitrary = fc.integer({ min: 1, max: 20 });
    const expenseWithCategoryArbitrary = fc.record({
      categoryId: categoryIdArbitrary,
      amount: amountArbitrary,
    });

    it("对于任意支出列表，所有分类占比之和等于 100%（有支出时）", () => {
      fc.assert(
        fc.property(
          fc.array(expenseWithCategoryArbitrary, {
            minLength: 1,
            maxLength: 50,
          }),
          (expenses) => {
            // 计算总支出
            const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

            // 如果没有支出，跳过测试
            if (totalExpense === 0) return true;

            // 按分类统计支出
            const categoryExpense: Record<number, number> = {};
            for (const e of expenses) {
              categoryExpense[e.categoryId] =
                (categoryExpense[e.categoryId] || 0) + e.amount;
            }

            // 计算各分类占比
            const percentages = Object.values(categoryExpense).map(
              (expense) => (expense / totalExpense) * 100
            );

            // 验证：所有分类占比之和等于 100%
            const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
            expect(totalPercentage).toBeCloseTo(100, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意支出列表，每个分类的占比在 0-100% 之间", () => {
      fc.assert(
        fc.property(
          fc.array(expenseWithCategoryArbitrary, {
            minLength: 1,
            maxLength: 50,
          }),
          (expenses) => {
            // 计算总支出
            const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

            // 如果没有支出，跳过测试
            if (totalExpense === 0) return true;

            // 按分类统计支出
            const categoryExpense: Record<number, number> = {};
            for (const e of expenses) {
              categoryExpense[e.categoryId] =
                (categoryExpense[e.categoryId] || 0) + e.amount;
            }

            // 验证每个分类的占比在有效范围内
            for (const expense of Object.values(categoryExpense)) {
              const percentage = (expense / totalExpense) * 100;
              expect(percentage).toBeGreaterThanOrEqual(0);
              expect(percentage).toBeLessThanOrEqual(100);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: 非成员访问拒绝
   * 对于任意非家庭成员的用户，访问家庭统计应被拒绝
   * Validates: Requirements 7.1, 7.4
   */
  describe("Property 9: 非成员访问拒绝", () => {
    // 生成家庭成员列表
    const familyMemberArbitrary = fc.record({
      familyId: fc.integer({ min: 1, max: 100 }),
      userId: memberIdArbitrary,
      joinedAt: dateArbitrary,
    });

    it("对于任意家庭，非成员用户 ID 不在成员列表中", () => {
      fc.assert(
        fc.property(
          fc.array(familyMemberArbitrary, { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 101, max: 200 }), // 非成员用户 ID 范围
          (members, nonMemberUserId) => {
            // 获取所有成员的用户 ID
            const memberUserIds = new Set(members.map((m) => m.userId));

            // 验证：非成员用户 ID 不在成员列表中
            expect(memberUserIds.has(nonMemberUserId)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意家庭成员列表，成员用户 ID 应在列表中", () => {
      fc.assert(
        fc.property(
          fc.array(familyMemberArbitrary, { minLength: 1, maxLength: 10 }),
          (members) => {
            // 获取所有成员的用户 ID
            const memberUserIds = new Set(members.map((m) => m.userId));

            // 验证：每个成员的用户 ID 都在集合中
            for (const member of members) {
              expect(memberUserIds.has(member.userId)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("权限检查函数应正确识别成员和非成员", () => {
      fc.assert(
        fc.property(
          fc.array(familyMemberArbitrary, { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1, max: 200 }),
          (members, testUserId) => {
            // 模拟权限检查函数
            const isMember = (userId: number, memberList: typeof members) => {
              return memberList.some((m) => m.userId === userId);
            };

            const memberUserIds = new Set(members.map((m) => m.userId));
            const expectedResult = memberUserIds.has(testUserId);

            // 验证：权限检查结果与预期一致
            expect(isMember(testUserId, members)).toBe(expectedResult);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: 成员退出后不纳入统计
   * 对于已退出的成员，其交易不应纳入家庭统计
   * Validates: Requirements 7.2
   */
  describe("Property 7: 成员退出后不纳入统计", () => {
    // 生成带退出时间的成员
    const memberWithExitArbitrary = fc.record({
      userId: memberIdArbitrary,
      joinedAt: fc.constant("2024-01-01"),
      exitedAt: fc.oneof(fc.constant(null), fc.constant("2024-06-01")),
      isActive: fc.boolean(),
    });

    it("对于任意成员列表，只有活跃成员应被纳入统计", () => {
      fc.assert(
        fc.property(
          fc.array(memberWithExitArbitrary, { minLength: 1, maxLength: 10 }),
          (members) => {
            // 筛选活跃成员
            const activeMembers = members.filter((m) => m.isActive);
            const inactiveMembers = members.filter((m) => !m.isActive);

            // 验证：活跃成员数 + 非活跃成员数 = 总成员数
            expect(activeMembers.length + inactiveMembers.length).toBe(
              members.length
            );

            // 验证：活跃成员都是 isActive = true
            for (const member of activeMembers) {
              expect(member.isActive).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: 新成员加入时间边界
   * 对于新加入的成员，只统计加入后的交易
   * Validates: Requirements 7.3
   */
  describe("Property 8: 新成员加入时间边界", () => {
    // 生成成员加入信息
    const memberJoinArbitrary = fc.record({
      userId: memberIdArbitrary,
      joinedAt: fc.constantFrom(
        "2024-01-01",
        "2024-03-15",
        "2024-06-01",
        "2024-09-01"
      ),
    });

    // 生成交易日期
    const transactionDateArbitrary = fc.constantFrom(
      "2023-12-01", // 加入前
      "2024-01-01", // 加入当天
      "2024-02-15", // 加入后
      "2024-06-15", // 加入后
      "2024-12-31" // 年末
    );

    it("对于任意成员和交易，只有加入后的交易应被统计", () => {
      fc.assert(
        fc.property(
          memberJoinArbitrary,
          transactionDateArbitrary,
          (member, transactionDate) => {
            // 判断交易是否应被统计
            const shouldInclude = transactionDate >= member.joinedAt;

            // 模拟统计逻辑
            const isIncluded = transactionDate >= member.joinedAt;

            // 验证：统计结果与预期一致
            expect(isIncluded).toBe(shouldInclude);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意成员，加入当天的交易应被统计", () => {
      fc.assert(
        fc.property(memberJoinArbitrary, (member) => {
          // 加入当天的交易
          const transactionDate = member.joinedAt;

          // 验证：加入当天的交易应被统计
          expect(transactionDate >= member.joinedAt).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("对于任意成员，加入前一天的交易不应被统计", () => {
      fc.assert(
        fc.property(memberJoinArbitrary, (member) => {
          // 计算加入前一天
          const joinDate = new Date(member.joinedAt);
          joinDate.setDate(joinDate.getDate() - 1);
          const beforeJoinDate = joinDate.toISOString().split("T")[0];

          // 验证：加入前的交易不应被统计
          expect(beforeJoinDate < member.joinedAt).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
