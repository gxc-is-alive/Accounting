import * as fc from "fast-check";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";

/**
 * Property 5: Unique Storage Path
 * 验证存储路径的唯一性
 */

// 模拟存储路径生成逻辑
function generateStoragePath(filename: string, mimeType: string): string {
  const ext = path.extname(filename) || getExtensionFromMimeType(mimeType);
  const uuid = uuidv4();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}/${month}/${uuid}${ext}`;
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
  };
  return mimeToExt[mimeType] || "";
}

// 生成有效的 MIME 类型
const validMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
];

const mimeTypeArb = fc.constantFrom(...validMimeTypes);

// 生成有效的文件名
const filenameArb = fc.string({ minLength: 1, maxLength: 100 }).map((s) => {
  // 确保文件名有效
  const sanitized = s.replace(/[<>:"/\\|?*]/g, "_");
  return sanitized || "file";
});

describe("Property 5: Unique Storage Path", () => {
  test("相同文件名生成不同的存储路径", () => {
    fc.assert(
      fc.property(filenameArb, mimeTypeArb, (filename, mimeType) => {
        const path1 = generateStoragePath(filename, mimeType);
        const path2 = generateStoragePath(filename, mimeType);

        // 即使文件名相同，路径也应该不同
        expect(path1).not.toBe(path2);
      }),
      { numRuns: 100 }
    );
  });

  test("批量生成的路径都是唯一的", () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(filenameArb, mimeTypeArb), {
          minLength: 2,
          maxLength: 50,
        }),
        (files) => {
          const paths = files.map(([filename, mimeType]) =>
            generateStoragePath(filename, mimeType)
          );

          // 所有路径都应该唯一
          const uniquePaths = new Set(paths);
          expect(uniquePaths.size).toBe(paths.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  test("存储路径格式正确", () => {
    fc.assert(
      fc.property(mimeTypeArb, (mimeType) => {
        // 使用固定的有效文件名，因为路径生成主要依赖 UUID
        const filename = "test.jpg";
        const storagePath = generateStoragePath(filename, mimeType);

        // 路径格式: YYYY/MM/uuid.ext
        const pathRegex = /^\d{4}\/\d{2}\/[a-f0-9-]{36}\.\w+$/;
        expect(storagePath).toMatch(pathRegex);
      }),
      { numRuns: 100 }
    );
  });

  test("存储路径包含正确的扩展名", () => {
    fc.assert(
      fc.property(mimeTypeArb, (mimeType) => {
        const filename = "test";
        const storagePath = generateStoragePath(filename, mimeType);
        const expectedExt = getExtensionFromMimeType(mimeType);

        expect(storagePath.endsWith(expectedExt)).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  test("文件名中的扩展名优先于 MIME 类型", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(".jpg", ".png", ".pdf", ".mp4"),
        mimeTypeArb,
        (ext, mimeType) => {
          const filename = `test${ext}`;
          const storagePath = generateStoragePath(filename, mimeType);

          // 应该使用文件名中的扩展名
          expect(storagePath.endsWith(ext)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  test("UUID 部分是有效的 UUID v4 格式", () => {
    fc.assert(
      fc.property(filenameArb, mimeTypeArb, (filename, mimeType) => {
        const storagePath = generateStoragePath(filename, mimeType);

        // 提取 UUID 部分
        const parts = storagePath.split("/");
        const filenamePart = parts[2]; // uuid.ext
        const uuidPart = filenamePart.split(".")[0];

        // UUID v4 格式验证
        const uuidRegex =
          /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
        expect(uuidPart).toMatch(uuidRegex);
      }),
      { numRuns: 100 }
    );
  });

  test("年月部分是有效的日期", () => {
    fc.assert(
      fc.property(filenameArb, mimeTypeArb, (filename, mimeType) => {
        const storagePath = generateStoragePath(filename, mimeType);

        const parts = storagePath.split("/");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);

        // 年份应该是合理的范围
        expect(year).toBeGreaterThanOrEqual(2020);
        expect(year).toBeLessThanOrEqual(2100);

        // 月份应该在 1-12 之间
        expect(month).toBeGreaterThanOrEqual(1);
        expect(month).toBeLessThanOrEqual(12);
      }),
      { numRuns: 100 }
    );
  });
});

describe("路径冲突概率测试", () => {
  test("大量生成不应产生冲突", () => {
    const paths = new Set<string>();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const path = generateStoragePath("test.jpg", "image/jpeg");
      paths.add(path);
    }

    // 所有路径都应该唯一
    expect(paths.size).toBe(iterations);
  });
});
