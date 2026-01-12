/**
 * 设备检测组合式函数
 * 提供响应式的设备类型检测和屏幕尺寸信息
 */
import { ref, computed, onMounted, onUnmounted } from "vue";

// 断点定义
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

export interface DeviceInfo {
  /** 屏幕宽度 */
  width: number;
  /** 屏幕高度 */
  height: number;
  /** 是否为移动端 (< 768px) */
  isMobile: boolean;
  /** 是否为平板 (768px - 1024px) */
  isTablet: boolean;
  /** 是否为桌面端 (> 1024px) */
  isDesktop: boolean;
  /** 是否支持触摸 */
  isTouch: boolean;
  /** 设备像素比 */
  pixelRatio: number;
}

// 全局状态，避免多个组件重复监听
const width = ref(typeof window !== "undefined" ? window.innerWidth : 1200);
const height = ref(typeof window !== "undefined" ? window.innerHeight : 800);
const isTouch = ref(
  typeof window !== "undefined" ? "ontouchstart" in window : false
);
const pixelRatio = ref(
  typeof window !== "undefined" ? window.devicePixelRatio : 1
);

let listenerCount = 0;
let resizeHandler: (() => void) | null = null;

/**
 * 设备检测组合式函数
 * @returns 设备信息和响应式状态
 */
export function useDevice() {
  // 计算属性：设备类型
  const isMobile = computed(() => width.value < BREAKPOINTS.mobile);
  const isTablet = computed(
    () => width.value >= BREAKPOINTS.mobile && width.value <= BREAKPOINTS.tablet
  );
  const isDesktop = computed(() => width.value > BREAKPOINTS.tablet);

  // 设备信息对象
  const device = computed<DeviceInfo>(() => ({
    width: width.value,
    height: height.value,
    isMobile: isMobile.value,
    isTablet: isTablet.value,
    isDesktop: isDesktop.value,
    isTouch: isTouch.value,
    pixelRatio: pixelRatio.value,
  }));

  // 更新尺寸
  const updateSize = () => {
    width.value = window.innerWidth;
    height.value = window.innerHeight;
    pixelRatio.value = window.devicePixelRatio;
  };

  // 防抖处理
  const debounce = <T extends (...args: unknown[]) => void>(
    fn: T,
    delay: number
  ) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  onMounted(() => {
    // 首次更新
    updateSize();
    isTouch.value = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    // 只在第一个组件挂载时添加监听器
    if (listenerCount === 0) {
      resizeHandler = debounce(updateSize, 100);
      window.addEventListener("resize", resizeHandler);
    }
    listenerCount++;
  });

  onUnmounted(() => {
    listenerCount--;
    // 最后一个组件卸载时移除监听器
    if (listenerCount === 0 && resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
  });

  return {
    // 响应式状态
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    pixelRatio,
    // 设备信息对象
    device,
    // 断点常量
    BREAKPOINTS,
  };
}

/**
 * 获取当前设备类型（非响应式，用于一次性判断）
 */
export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < BREAKPOINTS.mobile) return "mobile";
  if (w <= BREAKPOINTS.tablet) return "tablet";
  return "desktop";
}

/**
 * 检查是否为触摸设备
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export default useDevice;
