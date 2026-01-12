import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User, LoginRequest, RegisterRequest } from "@/types";
import { authApi } from "@/api";

export const useUserStore = defineStore("user", () => {
  // 状态
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value);

  // 初始化：从 localStorage 恢复状态
  const init = () => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      token.value = savedToken;
      try {
        user.value = JSON.parse(savedUser);
      } catch {
        user.value = null;
      }
    }
  };

  // 注册
  const register = async (data: RegisterRequest) => {
    loading.value = true;
    try {
      const res = (await authApi.register(data)) as { data: User };
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  // 登录
  const login = async (data: LoginRequest) => {
    loading.value = true;
    try {
      const res = (await authApi.login(data)) as {
        data: { token: string; user: User };
      };
      token.value = res.data.token;
      user.value = res.data.user;
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      return res.data;
    } finally {
      loading.value = false;
    }
  };

  // 退出登录
  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // 忽略错误
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  };

  // 获取当前用户信息
  const fetchUser = async () => {
    if (!token.value) return;
    loading.value = true;
    try {
      const res = (await authApi.me()) as { data: User };
      user.value = res.data;
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch {
      logout();
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    token,
    loading,
    isLoggedIn,
    init,
    register,
    login,
    logout,
    fetchUser,
  };
});
