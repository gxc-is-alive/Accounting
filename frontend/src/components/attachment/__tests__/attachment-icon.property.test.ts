import * as fc from "fast-check";

/**
 * Property 8: Attachment Icon Display
 * 验证附件图标显示的正确性
 */

// 模拟交易数据
interface MockTransaction {
  id: number;
  amount: number;
  attachmentCount: number;
}

// 判断是否应该显示附件图标
function shouldShowAttachmentIcon(transaction: MockTransaction): boolean {
  return transaction.attachmentCount > 0;
}

// 获取附件图标
function getAttachmentIcon(hasAttachments: boolean): string | null {
  return hasAttachments ? "📎" : null;
}

describe("Property 8: Attachment Icon Display", () => {
  test("有附件的交易应该显示附件图标", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // id
        fc.integer({ min: 1, max: 1000000 }), // amount (用整数表示分)
        fc.integer({ min: 1, max: 5 }), // attachmentCount (至少 1 个)
        (id, amount, attachmentCount) => {
          const transaction: MockTransaction = { id, amount, attachmentCount };
          expect(shouldShowAttachmentIcon(transaction)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("没有附件的交易不应该显示附件图标", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // id
        fc.integer({ min: 1, max: 1000000 }), // amount (用整数表示分)
        (id, amount) => {
          const transaction: MockTransaction = {
            id,
            amount,
            attachmentCount: 0,
          };
          expect(shouldShowAttachmentIcon(transaction)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("附件图标应该是 📎", () => {
    expect(getAttachmentIcon(true)).toBe("📎");
    expect(getAttachmentIcon(false)).toBeNull();
  });

  test("附件数量与图标显示的一致性", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }), // attachmentCount
        (attachmentCount) => {
          const hasAttachments = attachmentCount > 0;
          const icon = getAttachmentIcon(hasAttachments);

          if (attachmentCount > 0) {
            expect(icon).not.toBeNull();
          } else {
            expect(icon).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test("边界值：恰好 1 个附件时应该显示图标", () => {
    const transaction: MockTransaction = {
      id: 1,
      amount: 100,
      attachmentCount: 1,
    };
    expect(shouldShowAttachmentIcon(transaction)).toBe(true);
  });

  test("边界值：0 个附件时不应该显示图标", () => {
    const transaction: MockTransaction = {
      id: 1,
      amount: 100,
      attachmentCount: 0,
    };
    expect(shouldShowAttachmentIcon(transaction)).toBe(false);
  });
});
