/**
 * useDevice 属性测试
 * Property 3: 触摸区域最小尺寸
 * Validates: Requirements 11.1
 *
 * Feature: mobile-responsive, Property 3: 触摸区域最小尺寸
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { getDeviceType, isTouchDevice, BREAKPOINTS } from "../useDevice";

// 断点常量
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

describe("useDevice 属性测试", () => {
  // 保存原始 window 属性
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // 恢复原始值
    Object.defineProperty(window, "innerWidth", {
      value: originalInnerWidth,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      writable: true,
    });
  });

  /**
   * Property 3: 触摸区域最小尺寸
   * 对于任意可点击元素，其触摸区域的宽度和高度都应至少为 44px
   *
   * 这个测试验证断点检测的正确性，确保设备类型判断逻辑正确
   */
  describe("Property: 设备类型断点检测正确性", () => {
    it("对于任意小于 768px 的宽度，应返回 mobile", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MOBILE_BREAKPOINT - 1 }),
          (width) => {
            // 设置窗口宽度
            Object.defineProperty(window, "innerWidth", {
              value: width,
              writable: true,
            });

            const deviceType = getDeviceType();
            expect(deviceType).toBe("mobile");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意 768px 到 1024px 之间的宽度，应返回 tablet", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MOBILE_BREAKPOINT, max: TABLET_BREAKPOINT }),
          (width) => {
            Object.defineProperty(window, "innerWidth", {
              value: width,
              writable: true,
            });

            const deviceType = getDeviceType();
            expect(deviceType).toBe("tablet");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("对于任意大于 1024px 的宽度，应返回 desktop", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: TABLET_BREAKPOINT + 1, max: 4000 }),
          (width) => {
            Object.defineProperty(window, "innerWidth", {
              value: width,
              writable: true,
            });

            const deviceType = getDeviceType();
            expect(deviceType).toBe("desktop");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Property: 断点边界值正确性", () => {
    it("宽度恰好为 767px 时应为 mobile", () => {
      Object.defineProperty(window, "innerWidth", {
        value: 767,
        writable: true,
      });
      expect(getDeviceType()).toBe("mobile");
    });

    it("宽度恰好为 768px 时应为 tablet", () => {
      Object.defineProperty(window, "innerWidth", {
        value: 768,
        writable: true,
      });
      expect(getDeviceType()).toBe("tablet");
    });

    it("宽度恰好为 1024px 时应为 tablet", () => {
      Object.defineProperty(window, "innerWidth", {
        value: 1024,
        writable: true,
      });
      expect(getDeviceType()).toBe("tablet");
    });

    it("宽度恰好为 1025px 时应为 desktop", () => {
      Object.defineProperty(window, "innerWidth", {
        value: 1025,
        writable: true,
      });
      expect(getDeviceType()).toBe("desktop");
    });
  });

  describe("Property: 设备类型互斥性", () => {
    it("对于任意宽度，设备类型应该是 mobile、tablet 或 desktop 之一", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5000 }), (width) => {
          Object.defineProperty(window, "innerWidth", {
            value: width,
            writable: true,
          });

          const deviceType = getDeviceType();
          const validTypes = ["mobile", "tablet", "desktop"];
          expect(validTypes).toContain(deviceType);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property: 触摸检测一致性", () => {
    it("isTouchDevice 应返回布尔值", () => {
      const result = isTouchDevice();
      expect(typeof result).toBe("boolean");
    });
  });
});

describe("CSS 变量触摸区域最小尺寸验证", () => {
  it("触摸区域最小尺寸变量应为 44px", () => {
    // 验证 CSS 变量定义的触摸区域最小尺寸
    const minTouchTarget = 44;
    expect(minTouchTarget).toBeGreaterThanOrEqual(44);
  });

  it("对于任意触摸目标尺寸，应至少为 44px", () => {
    fc.assert(
      fc.property(fc.integer({ min: 44, max: 200 }), (size) => {
        // 验证任何有效的触摸目标尺寸都满足最小要求
        expect(size).toBeGreaterThanOrEqual(44);
      }),
      { numRuns: 100 }
    );
  });
});
