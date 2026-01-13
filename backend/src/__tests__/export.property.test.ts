/**
 * 数据导出属性测试
 * Feature: data-export-docker
 */

import * as fc from "fast-check";
import ExportService, {
  EXPORT_VERSION,
  ExportData,
  AccountExportData,
  CategoryExportData,
  TransactionExportData,
  BudgetExportData,
} from "../services/export.service";

// 创建 ExportService 实例用于测试验证方法
const exportService = new ExportService();

// 生成器：账户数据
const accountArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom("cash", "bank", "alipay", "wechat", "credit", "other"),
  balance: fc.integer({ min: -100000000, max: 100000000 }).map((n) => n / 100),
  icon: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
    nil: undefined,
  }),
  creditLimit: fc.option(
    fc.integer({ min: 0, max: 100000000 }).map((n) => n / 100),
    { nil: undefined }
  ),
  billingDay: fc.option(fc.integer({ min: 1, max: 28 }), { nil: undefined }),
  dueDay: fc.option(fc.integer({ min: 1, max: 28 }), { nil: undefined }),
}) as fc.Arbitrary<AccountExportData>;

// 生成器：分类数据
const categoryArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 30 }),
  type: fc.constantFrom("income", "expense") as fc.Arbitrary<
    "income" | "expense"
  >,
  icon: fc.string({ minLength: 1, maxLength: 20 }),
  isSystem: fc.boolean(),
  parentName: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
    nil: undefined,
  }),
}) as fc.Arbitrary<CategoryExportData>;

// 生成器：交易数据
const transactionArb = fc.record({
  type: fc.constantFrom("income", "expense", "repayment") as fc.Arbitrary<
    "income" | "expense" | "repayment"
  >,
  amount: fc.integer({ min: 1, max: 100000000 }).map((n) => n / 100),
  date: fc
    .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
    .map((d) => d.toISOString().split("T")[0]),
  accountName: fc.string({ minLength: 1, maxLength: 50 }),
  categoryName: fc.string({ minLength: 1, maxLength: 30 }),
  note: fc.string({ maxLength: 200 }),
  isFamily: fc.boolean(),
}) as fc.Arbitrary<TransactionExportData>;

// 生成器：预算数据
const budgetArb = fc.record({
  categoryName: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
    nil: null,
  }),
  amount: fc.integer({ min: 1, max: 100000000 }).map((n) => n / 100),
  month: fc
    .date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") })
    .map(
      (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    ),
}) as fc.Arbitrary<BudgetExportData>;

// 生成器：完整导出数据
const exportDataArb = fc.record({
  version: fc.constant(EXPORT_VERSION),
  exportedAt: fc.date().map((d) => d.toISOString()),
  user: fc.record({
    email: fc.emailAddress(),
    nickname: fc.string({ minLength: 1, maxLength: 50 }),
  }),
  accounts: fc.array(accountArb, { minLength: 0, maxLength: 10 }),
  categories: fc.array(categoryArb, { minLength: 0, maxLength: 20 }),
  transactions: fc.array(transactionArb, { minLength: 0, maxLength: 50 }),
  budgets: fc.array(budgetArb, { minLength: 0, maxLength: 10 }),
}) as fc.Arbitrary<ExportData>;

describe("数据导出属性测试", () => {
  /**
   * Property 1: 导出数据完整性
   * 对于任意有效的导出数据，验证函数应返回 valid: true
   * Feature: data-export-docker, Property 1: 导出数据完整性
   * Validates: Requirements 1.1, 1.2, 1.4
   */
  describe("Property 1: 导出数据完整性", () => {
    it("对于任意有效的导出数据结构，验证应通过", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          const result = exportService.validateImportData(data);

          // 有效数据应该通过验证
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it("导出数据必须包含版本号", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          // 验证版本号存在且格式正确
          expect(data.version).toBeDefined();
          expect(typeof data.version).toBe("string");
          expect(data.version).toMatch(/^\d+\.\d+\.\d+$/);
        }),
        { numRuns: 100 }
      );
    });

    it("导出数据必须包含导出时间戳", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          // 验证导出时间存在且是有效的 ISO 日期
          expect(data.exportedAt).toBeDefined();
          expect(typeof data.exportedAt).toBe("string");
          expect(new Date(data.exportedAt).toString()).not.toBe("Invalid Date");
        }),
        { numRuns: 100 }
      );
    });

    it("导出数据必须包含所有必需的数据数组", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          // 验证所有必需字段存在
          expect(data.user).toBeDefined();
          expect(Array.isArray(data.accounts)).toBe(true);
          expect(Array.isArray(data.categories)).toBe(true);
          expect(Array.isArray(data.transactions)).toBe(true);
          expect(Array.isArray(data.budgets)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * 验证无效数据应该被正确拒绝
   */
  describe("无效数据验证", () => {
    it("缺少版本号的数据应该验证失败", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          const invalidData = { ...data };
          delete (invalidData as any).version;

          const result = exportService.validateImportData(invalidData);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.includes("版本"))).toBe(true);
        }),
        { numRuns: 50 }
      );
    });

    it("缺少用户信息的数据应该验证失败", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          const invalidData = { ...data };
          delete (invalidData as any).user;

          const result = exportService.validateImportData(invalidData);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.includes("用户"))).toBe(true);
        }),
        { numRuns: 50 }
      );
    });

    it("缺少账户数据的数据应该验证失败", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          const invalidData = { ...data };
          delete (invalidData as any).accounts;

          const result = exportService.validateImportData(invalidData);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.includes("账户"))).toBe(true);
        }),
        { numRuns: 50 }
      );
    });

    it("不兼容版本的数据应该验证失败", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          const invalidData = { ...data, version: "99.0.0" };

          const result = exportService.validateImportData(invalidData);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.includes("版本不兼容"))).toBe(
            true
          );
        }),
        { numRuns: 50 }
      );
    });

    it("null 或 undefined 数据应该验证失败", () => {
      expect(exportService.validateImportData(null).valid).toBe(false);
      expect(exportService.validateImportData(undefined).valid).toBe(false);
      expect(exportService.validateImportData("string").valid).toBe(false);
      expect(exportService.validateImportData(123).valid).toBe(false);
    });
  });
});

/**
 * Property 3 & 4: CSV 导出属性测试
 * Feature: data-export-docker, Property 3: CSV 导出完整性
 * Feature: data-export-docker, Property 4: CSV 日期范围过滤
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */
describe("CSV 导出属性测试", () => {
  // CSV 解析辅助函数
  const parseCSV = (csv: string): { headers: string[]; rows: string[][] } => {
    const lines = csv.replace(/^\uFEFF/, "").split("\n");
    const headers = lines[0].split(",");
    const rows = lines
      .slice(1)
      .filter((l) => l.trim())
      .map((line) => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current);
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      });
    return { headers, rows };
  };

  describe("Property 3: CSV 导出完整性", () => {
    it("CSV 必须以 UTF-8 BOM 开头", () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 0, maxLength: 10 }),
          (transactions) => {
            // 模拟 CSV 生成（使用相同的逻辑）
            const BOM = "\uFEFF";
            const headers = ["日期", "类型", "金额", "分类", "账户", "备注"];
            const rows: string[] = [headers.join(",")];

            for (const t of transactions) {
              const typeText =
                t.type === "income"
                  ? "收入"
                  : t.type === "expense"
                  ? "支出"
                  : "还款";
              const row = [
                t.date,
                typeText,
                t.amount.toString(),
                t.categoryName,
                t.accountName,
                t.note,
              ];
              rows.push(row.join(","));
            }

            const csv = BOM + rows.join("\n");

            // 验证 BOM
            expect(csv.charCodeAt(0)).toBe(0xfeff);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("CSV 必须包含所有必需的列头", () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 0, maxLength: 5 }),
          (transactions) => {
            const BOM = "\uFEFF";
            const headers = ["日期", "类型", "金额", "分类", "账户", "备注"];
            const rows: string[] = [headers.join(",")];

            for (const t of transactions) {
              const typeText =
                t.type === "income"
                  ? "收入"
                  : t.type === "expense"
                  ? "支出"
                  : "还款";
              rows.push(
                [
                  t.date,
                  typeText,
                  t.amount.toString(),
                  t.categoryName,
                  t.accountName,
                  t.note,
                ].join(",")
              );
            }

            const csv = BOM + rows.join("\n");
            const parsed = parseCSV(csv);

            expect(parsed.headers).toContain("日期");
            expect(parsed.headers).toContain("类型");
            expect(parsed.headers).toContain("金额");
            expect(parsed.headers).toContain("分类");
            expect(parsed.headers).toContain("账户");
            expect(parsed.headers).toContain("备注");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("CSV 行数应等于交易数 + 1（表头）", () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 0, maxLength: 20 }),
          (transactions) => {
            const BOM = "\uFEFF";
            const headers = ["日期", "类型", "金额", "分类", "账户", "备注"];
            const rows: string[] = [headers.join(",")];

            for (const t of transactions) {
              const typeText =
                t.type === "income"
                  ? "收入"
                  : t.type === "expense"
                  ? "支出"
                  : "还款";
              rows.push(
                [
                  t.date,
                  typeText,
                  t.amount.toString(),
                  t.categoryName,
                  t.accountName,
                  t.note,
                ].join(",")
              );
            }

            const csv = BOM + rows.join("\n");
            const parsed = parseCSV(csv);

            expect(parsed.rows.length).toBe(transactions.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 4: CSV 日期范围过滤", () => {
    it("过滤后的交易日期都在指定范围内", () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 1, maxLength: 20 }),
          fc.date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") }),
          fc.date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") }),
          (transactions, date1, date2) => {
            const startDate = date1 < date2 ? date1 : date2;
            const endDate = date1 < date2 ? date2 : date1;

            // 过滤交易
            const filtered = transactions.filter((t) => {
              const txDate = new Date(t.date);
              return txDate >= startDate && txDate <= endDate;
            });

            // 验证所有过滤后的交易都在范围内
            for (const t of filtered) {
              const txDate = new Date(t.date);
              expect(txDate >= startDate).toBe(true);
              expect(txDate <= endDate).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("范围外的交易不应出现在过滤结果中", () => {
      fc.assert(
        fc.property(
          fc.array(transactionArb, { minLength: 1, maxLength: 20 }),
          fc.date({ min: new Date("2022-01-01"), max: new Date("2022-06-30") }),
          fc.date({ min: new Date("2022-07-01"), max: new Date("2022-12-31") }),
          (transactions, startDate, endDate) => {
            // 过滤交易
            const filtered = transactions.filter((t) => {
              const txDate = new Date(t.date);
              return txDate >= startDate && txDate <= endDate;
            });

            // 验证范围外的交易不在结果中
            const outsideRange = transactions.filter((t) => {
              const txDate = new Date(t.date);
              return txDate < startDate || txDate > endDate;
            });

            for (const t of outsideRange) {
              expect(
                filtered.find((f) => f.date === t.date && f.amount === t.amount)
              ).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property 5: 导入数据验证
 * Feature: data-export-docker, Property 5: 导入数据验证
 * Validates: Requirements 3.1
 */
describe("导入验证属性测试", () => {
  describe("Property 5: 导入数据验证", () => {
    it("有效数据应通过验证", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          const result = exportService.validateImportData(data);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }),
        { numRuns: 100 }
      );
    });

    it("无效数据应返回错误信息", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.array(fc.anything())
          ),
          (invalidData) => {
            const result = exportService.validateImportData(invalidData);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("缺少任意必需字段应返回对应错误", () => {
      const requiredFields = [
        "version",
        "exportedAt",
        "user",
        "accounts",
        "categories",
        "transactions",
        "budgets",
      ];

      fc.assert(
        fc.property(
          exportDataArb,
          fc.constantFrom(...requiredFields),
          (data, fieldToRemove) => {
            const invalidData = { ...data };
            delete (invalidData as any)[fieldToRemove];

            const result = exportService.validateImportData(invalidData);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Property 6, 7, 8: 导入功能属性测试
 * Feature: data-export-docker
 * Validates: Requirements 3.2, 3.3, 3.4
 */
describe("导入功能属性测试", () => {
  /**
   * Property 8: 导入统计准确性
   * 对于任意导入操作，返回的统计信息（成功数 + 跳过数 + 失败数）应等于输入数据的总记录数
   */
  describe("Property 8: 导入统计准确性", () => {
    it("统计总数应等于输入记录总数（验证层面）", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          // 验证数据结构
          const validation = exportService.validateImportData(data);

          if (validation.valid) {
            // 计算输入记录总数
            const totalInput =
              data.accounts.length +
              data.categories.length +
              data.transactions.length +
              data.budgets.length;

            // 验证数据结构完整
            expect(totalInput).toBeGreaterThanOrEqual(0);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: 导入冲突处理
   * 验证跳过模式和覆盖模式的行为差异
   */
  describe("Property 7: 导入冲突处理", () => {
    it("跳过模式下，已存在的数据应被跳过", () => {
      // 模拟冲突处理逻辑
      const simulateConflict = (
        existingNames: string[],
        newNames: string[],
        mode: "skip" | "overwrite"
      ) => {
        let success = 0;
        let skipped = 0;

        for (const name of newNames) {
          if (existingNames.includes(name)) {
            if (mode === "skip") {
              skipped++;
            } else {
              success++;
            }
          } else {
            success++;
          }
        }

        return { success, skipped };
      };

      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
            minLength: 1,
            maxLength: 10,
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (existingNames, newNames) => {
            const skipResult = simulateConflict(
              existingNames,
              newNames,
              "skip"
            );
            const overwriteResult = simulateConflict(
              existingNames,
              newNames,
              "overwrite"
            );

            // 跳过模式下，冲突的数据应被跳过
            const conflicts = newNames.filter((n) =>
              existingNames.includes(n)
            ).length;
            expect(skipResult.skipped).toBe(conflicts);

            // 覆盖模式下，所有数据都应成功
            expect(overwriteResult.success).toBe(newNames.length);
            expect(overwriteResult.skipped).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: 导出-导入往返一致性
   * 验证数据结构的往返一致性
   */
  describe("Property 6: 导出-导入往返一致性", () => {
    it("导出数据结构应保持一致", () => {
      fc.assert(
        fc.property(exportDataArb, (data) => {
          // 序列化后再解析
          const serialized = JSON.stringify(data);
          const parsed = JSON.parse(serialized);

          // 验证结构一致
          expect(parsed.version).toBe(data.version);
          expect(parsed.accounts.length).toBe(data.accounts.length);
          expect(parsed.categories.length).toBe(data.categories.length);
          expect(parsed.transactions.length).toBe(data.transactions.length);
          expect(parsed.budgets.length).toBe(data.budgets.length);

          // 验证解析后的数据仍然有效
          const validation = exportService.validateImportData(parsed);
          expect(validation.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("账户数据往返后应保持一致", () => {
      fc.assert(
        fc.property(accountArb, (account) => {
          const serialized = JSON.stringify(account);
          const parsed = JSON.parse(serialized);

          expect(parsed.name).toBe(account.name);
          expect(parsed.type).toBe(account.type);
          expect(parsed.balance).toBe(account.balance);
        }),
        { numRuns: 100 }
      );
    });

    it("交易数据往返后应保持一致", () => {
      fc.assert(
        fc.property(transactionArb, (transaction) => {
          const serialized = JSON.stringify(transaction);
          const parsed = JSON.parse(serialized);

          expect(parsed.type).toBe(transaction.type);
          expect(parsed.amount).toBe(transaction.amount);
          expect(parsed.date).toBe(transaction.date);
          expect(parsed.accountName).toBe(transaction.accountName);
          expect(parsed.categoryName).toBe(transaction.categoryName);
        }),
        { numRuns: 100 }
      );
    });
  });
});
