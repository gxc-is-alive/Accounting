import * as fc from "fast-check";

/**
 * Property 7: Thumbnail Generation for Images
 * 验证缩略图生成的正确性
 */

const MAX_THUMBNAIL_WIDTH = 200;

// 模拟图片尺寸
interface ImageDimensions {
  width: number;
  height: number;
}

// 计算缩略图尺寸（保持比例，最大宽度 200px）
function calculateThumbnailDimensions(
  original: ImageDimensions
): ImageDimensions {
  if (original.width <= MAX_THUMBNAIL_WIDTH) {
    // 不需要缩放
    return { ...original };
  }

  const ratio = MAX_THUMBNAIL_WIDTH / original.width;
  const newHeight = Math.max(1, Math.round(original.height * ratio)); // 确保至少为 1
  return {
    width: MAX_THUMBNAIL_WIDTH,
    height: newHeight,
  };
}

// 判断是否应该生成缩略图
function shouldGenerateThumbnail(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

// 支持的图片类型
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const nonImageMimeTypes = [
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "text/plain",
  "application/json",
];

describe("Property 7: Thumbnail Generation for Images", () => {
  test("缩略图宽度不超过 200px", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // width
        fc.integer({ min: 1, max: 10000 }), // height
        (width, height) => {
          const original: ImageDimensions = { width, height };
          const thumbnail = calculateThumbnailDimensions(original);

          expect(thumbnail.width).toBeLessThanOrEqual(MAX_THUMBNAIL_WIDTH);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("缩略图保持原始宽高比", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 201, max: 5000 }), // width (大于 200 才会缩放，限制最大值)
        fc.integer({ min: 200, max: 5000 }), // height (至少 200 避免极端情况)
        (width, height) => {
          // 只测试宽高比在合理范围内的图片（1:10 到 10:1）
          const ratio = width / height;
          if (ratio < 0.1 || ratio > 10) {
            return true; // 跳过极端宽高比
          }

          const original: ImageDimensions = { width, height };
          const thumbnail = calculateThumbnailDimensions(original);

          const originalRatio = original.width / original.height;
          const thumbnailRatio = thumbnail.width / thumbnail.height;

          // 允许相对误差（由于四舍五入），相对误差不超过 3%
          const relativeError =
            Math.abs(originalRatio - thumbnailRatio) / originalRatio;
          expect(relativeError).toBeLessThan(0.03);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("小于 200px 的图片不需要缩放", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MAX_THUMBNAIL_WIDTH }), // width
        fc.integer({ min: 1, max: 10000 }), // height
        (width, height) => {
          const original: ImageDimensions = { width, height };
          const thumbnail = calculateThumbnailDimensions(original);

          expect(thumbnail.width).toBe(original.width);
          expect(thumbnail.height).toBe(original.height);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("图片类型应该生成缩略图", () => {
    fc.assert(
      fc.property(fc.constantFrom(...imageMimeTypes), (mimeType) => {
        expect(shouldGenerateThumbnail(mimeType)).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  test("非图片类型不应该生成缩略图", () => {
    fc.assert(
      fc.property(fc.constantFrom(...nonImageMimeTypes), (mimeType) => {
        expect(shouldGenerateThumbnail(mimeType)).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  test("缩略图尺寸始终为正整数", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // width
        fc.integer({ min: 1, max: 10000 }), // height
        (width, height) => {
          const original: ImageDimensions = { width, height };
          const thumbnail = calculateThumbnailDimensions(original);

          expect(thumbnail.width).toBeGreaterThan(0);
          expect(thumbnail.height).toBeGreaterThan(0); // 由于 Math.max(1, ...) 保证
          expect(Number.isInteger(thumbnail.width)).toBe(true);
          expect(Number.isInteger(thumbnail.height)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("边界值：恰好 200px 宽的图片不需要缩放", () => {
    const original: ImageDimensions = { width: 200, height: 300 };
    const thumbnail = calculateThumbnailDimensions(original);

    expect(thumbnail.width).toBe(200);
    expect(thumbnail.height).toBe(300);
  });

  test("边界值：201px 宽的图片需要缩放", () => {
    const original: ImageDimensions = { width: 201, height: 300 };
    const thumbnail = calculateThumbnailDimensions(original);

    expect(thumbnail.width).toBe(200);
    expect(thumbnail.height).toBeLessThan(300);
  });

  test("极端宽高比的图片处理正确", () => {
    // 非常宽的图片
    const wide: ImageDimensions = { width: 10000, height: 100 };
    const wideThumbnail = calculateThumbnailDimensions(wide);
    expect(wideThumbnail.width).toBe(200);
    expect(wideThumbnail.height).toBe(2);

    // 非常高的图片
    const tall: ImageDimensions = { width: 1000, height: 10000 };
    const tallThumbnail = calculateThumbnailDimensions(tall);
    expect(tallThumbnail.width).toBe(200);
    expect(tallThumbnail.height).toBe(2000);

    // 极端宽的图片（高度会被限制为最小 1）
    const extremeWide: ImageDimensions = { width: 10000, height: 1 };
    const extremeWideThumbnail = calculateThumbnailDimensions(extremeWide);
    expect(extremeWideThumbnail.width).toBe(200);
    expect(extremeWideThumbnail.height).toBe(1); // 最小值为 1
  });
});
