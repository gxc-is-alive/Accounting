import * as fc from "fast-check";

/**
 * Property 2: Attachment Count Limit
 * 验证附件数量限制的正确性
 */

const MAX_ATTACHMENTS = 5;

// 模拟附件上传验证逻辑
function canUploadMore(
  currentCount: number,
  maxCount: number = MAX_ATTACHMENTS
): boolean {
  return currentCount < maxCount;
}

// 模拟批量上传验证
function validateBatchUpload(
  fileCount: number,
  currentCount: number,
  maxCount: number = MAX_ATTACHMENTS
): { allowed: number; rejected: number } {
  const availableSlots = Math.max(0, maxCount - currentCount);
  const allowed = Math.min(fileCount, availableSlots);
  const rejected = fileCount - allowed;
  return { allowed, rejected };
}

describe("Property 2: Attachment Count Limit", () => {
  test("当附件数量小于限制时，应该允许上传", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_ATTACHMENTS - 1 }), // currentCount
        (currentCount) => {
          expect(canUploadMore(currentCount)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("当附件数量等于限制时，应该拒绝上传", () => {
    expect(canUploadMore(MAX_ATTACHMENTS)).toBe(false);
  });

  test("当附件数量超过限制时，应该拒绝上传", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: MAX_ATTACHMENTS, max: 100 }), // currentCount
        (currentCount) => {
          expect(canUploadMore(currentCount)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("批量上传时，只接受不超过剩余配额的文件", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: MAX_ATTACHMENTS }), // currentCount
        fc.integer({ min: 1, max: 10 }), // fileCount
        (currentCount, fileCount) => {
          const result = validateBatchUpload(fileCount, currentCount);
          const availableSlots = MAX_ATTACHMENTS - currentCount;

          // 允许的数量不超过剩余配额
          expect(result.allowed).toBeLessThanOrEqual(availableSlots);
          // 允许的数量不超过上传的文件数
          expect(result.allowed).toBeLessThanOrEqual(fileCount);
          // 允许 + 拒绝 = 总数
          expect(result.allowed + result.rejected).toBe(fileCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("自定义最大数量限制应该生效", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // customMax
        fc.integer({ min: 0, max: 20 }), // currentCount
        (customMax, currentCount) => {
          const canUpload = canUploadMore(currentCount, customMax);
          expect(canUpload).toBe(currentCount < customMax);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("边界值：恰好达到限制时的行为", () => {
    // 4 个附件时可以上传
    expect(canUploadMore(4)).toBe(true);
    // 5 个附件时不能上传
    expect(canUploadMore(5)).toBe(false);
  });

  test("批量上传边界情况", () => {
    // 已有 4 个，上传 3 个，只能接受 1 个
    const result1 = validateBatchUpload(3, 4);
    expect(result1.allowed).toBe(1);
    expect(result1.rejected).toBe(2);

    // 已有 5 个，上传任意数量都被拒绝
    const result2 = validateBatchUpload(5, 5);
    expect(result2.allowed).toBe(0);
    expect(result2.rejected).toBe(5);

    // 已有 0 个，上传 5 个全部接受
    const result3 = validateBatchUpload(5, 0);
    expect(result3.allowed).toBe(5);
    expect(result3.rejected).toBe(0);

    // 已有 0 个，上传 10 个只接受 5 个
    const result4 = validateBatchUpload(10, 0);
    expect(result4.allowed).toBe(5);
    expect(result4.rejected).toBe(5);
  });
});
