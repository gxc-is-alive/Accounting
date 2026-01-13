/**
 * Property 1: File Validation Correctness
 *
 * For any file with a given MIME type and size, the validation function should return
 * `valid: true` if and only if:
 * - The MIME type is in the allowed list
 * - The file size does not exceed the limit for its type
 *
 * Validates: Requirements 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import * as fc from "fast-check";
import {
  validateFile,
  getAllAllowedMimeTypes,
  getFileSizeLimit,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
} from "../services/storage/fileStorage.interface";

describe("Property 1: File Validation Correctness", () => {
  const allowedMimeTypes = getAllAllowedMimeTypes();

  // 生成允许的 MIME 类型
  const allowedMimeTypeArb = fc.constantFrom(...allowedMimeTypes);

  // 生成不允许的 MIME 类型
  const disallowedMimeTypeArb = fc.constantFrom(
    "text/plain",
    "application/json",
    "application/xml",
    "text/html",
    "application/zip",
    "audio/mp3",
    "application/octet-stream",
    "image/svg+xml",
    "video/avi",
    "application/msword"
  );

  // 生成文件大小（字节）
  const fileSizeArb = fc.integer({ min: 1, max: 100 * 1024 * 1024 }); // 1B - 100MB

  describe("允许的文件类型验证", () => {
    it("对于允许的 MIME 类型且大小在限制内，应返回 valid: true", () => {
      fc.assert(
        fc.property(allowedMimeTypeArb, (mimeType) => {
          const sizeLimit = getFileSizeLimit(mimeType);
          // 生成一个在限制内的大小
          const size = Math.floor(Math.random() * sizeLimit) + 1;

          const result = validateFile(mimeType, size);

          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it("对于允许的 MIME 类型但大小超过限制，应返回 valid: false", () => {
      fc.assert(
        fc.property(allowedMimeTypeArb, (mimeType) => {
          const sizeLimit = getFileSizeLimit(mimeType);
          // 生成一个超过限制的大小
          const size = sizeLimit + 1;

          const result = validateFile(mimeType, size);

          expect(result.valid).toBe(false);
          expect(result.error).toContain("文件大小超过限制");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("不允许的文件类型验证", () => {
    it("对于不允许的 MIME 类型，无论大小如何，应返回 valid: false", () => {
      fc.assert(
        fc.property(disallowedMimeTypeArb, fileSizeArb, (mimeType, size) => {
          const result = validateFile(mimeType, size);

          expect(result.valid).toBe(false);
          expect(result.error).toContain("不支持的文件类型");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("边界值测试", () => {
    it("图片文件大小恰好等于 10MB 应该通过", () => {
      ALLOWED_MIME_TYPES.image.forEach((mimeType) => {
        const result = validateFile(mimeType, FILE_SIZE_LIMITS.image);
        expect(result.valid).toBe(true);
      });
    });

    it("图片文件大小超过 10MB 1字节应该失败", () => {
      ALLOWED_MIME_TYPES.image.forEach((mimeType) => {
        const result = validateFile(mimeType, FILE_SIZE_LIMITS.image + 1);
        expect(result.valid).toBe(false);
      });
    });

    it("PDF 文件大小恰好等于 10MB 应该通过", () => {
      ALLOWED_MIME_TYPES.pdf.forEach((mimeType) => {
        const result = validateFile(mimeType, FILE_SIZE_LIMITS.pdf);
        expect(result.valid).toBe(true);
      });
    });

    it("视频文件大小恰好等于 50MB 应该通过", () => {
      ALLOWED_MIME_TYPES.video.forEach((mimeType) => {
        const result = validateFile(mimeType, FILE_SIZE_LIMITS.video);
        expect(result.valid).toBe(true);
      });
    });

    it("视频文件大小超过 50MB 1字节应该失败", () => {
      ALLOWED_MIME_TYPES.video.forEach((mimeType) => {
        const result = validateFile(mimeType, FILE_SIZE_LIMITS.video + 1);
        expect(result.valid).toBe(false);
      });
    });

    it("文件大小为 1 字节应该通过（最小有效大小）", () => {
      allowedMimeTypes.forEach((mimeType) => {
        const result = validateFile(mimeType, 1);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe("具体文件类型测试", () => {
    it("应该接受 JPEG 图片", () => {
      const result = validateFile("image/jpeg", 1024 * 1024); // 1MB
      expect(result.valid).toBe(true);
    });

    it("应该接受 PNG 图片", () => {
      const result = validateFile("image/png", 5 * 1024 * 1024); // 5MB
      expect(result.valid).toBe(true);
    });

    it("应该接受 GIF 图片", () => {
      const result = validateFile("image/gif", 2 * 1024 * 1024); // 2MB
      expect(result.valid).toBe(true);
    });

    it("应该接受 WebP 图片", () => {
      const result = validateFile("image/webp", 3 * 1024 * 1024); // 3MB
      expect(result.valid).toBe(true);
    });

    it("应该接受 PDF 文档", () => {
      const result = validateFile("application/pdf", 8 * 1024 * 1024); // 8MB
      expect(result.valid).toBe(true);
    });

    it("应该接受 MP4 视频", () => {
      const result = validateFile("video/mp4", 40 * 1024 * 1024); // 40MB
      expect(result.valid).toBe(true);
    });

    it("应该接受 MOV 视频", () => {
      const result = validateFile("video/quicktime", 45 * 1024 * 1024); // 45MB
      expect(result.valid).toBe(true);
    });

    it("应该拒绝 SVG 图片（安全考虑）", () => {
      const result = validateFile("image/svg+xml", 1024);
      expect(result.valid).toBe(false);
    });

    it("应该拒绝可执行文件", () => {
      const result = validateFile("application/x-executable", 1024);
      expect(result.valid).toBe(false);
    });
  });
});
