import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useUserStore } from "@/stores/user";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/auth/RegisterView.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/",
    component: () => import("@/layouts/ResponsiveLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Dashboard",
        component: () => import("@/views/dashboard/DashboardView.vue"),
        meta: { title: "首页" },
      },
      {
        path: "transactions",
        name: "Transactions",
        component: () => import("@/views/transaction/TransactionList.vue"),
        meta: { title: "账单明细" },
      },
      {
        path: "add",
        name: "QuickAdd",
        component: () => import("@/views/transaction/QuickAdd.vue"),
        meta: { title: "记一笔" },
      },
      {
        path: "statistics",
        name: "Statistics",
        component: () => import("@/views/statistics/MonthlyReport.vue"),
        meta: { title: "月度报表" },
      },
      {
        path: "statistics/yearly",
        name: "YearlyReport",
        component: () => import("@/views/statistics/YearlyReport.vue"),
        meta: { title: "年度报表" },
      },
      {
        path: "family",
        name: "Family",
        component: () => import("@/views/family/FamilyManage.vue"),
        meta: { title: "家庭管理" },
      },
      {
        path: "family/transactions",
        name: "FamilyTransactions",
        component: () => import("@/views/family/FamilyTransactions.vue"),
        meta: { title: "家庭账目" },
      },
      {
        path: "budget",
        name: "Budget",
        component: () => import("@/views/budget/BudgetManage.vue"),
        meta: { title: "预算管理" },
      },
      {
        path: "settings/accounts",
        name: "AccountManage",
        component: () => import("@/views/settings/AccountManage.vue"),
        meta: { title: "账户管理" },
      },
      {
        path: "settings/categories",
        name: "CategoryManage",
        component: () => import("@/views/settings/CategoryManage.vue"),
        meta: { title: "分类管理" },
      },
      {
        path: "settings/bill-types",
        name: "BillTypeManage",
        component: () => import("@/views/settings/BillTypeManage.vue"),
        meta: { title: "账单类型" },
      },
      {
        path: "credit/repayment",
        name: "CreditRepayment",
        component: () => import("@/views/credit/RepaymentView.vue"),
        meta: { title: "信用还款" },
      },
      {
        path: "ai",
        name: "AIAssistant",
        component: () => import("@/views/ai/AIAssistant.vue"),
        meta: { title: "AI 助手" },
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/profile/ProfileView.vue"),
        meta: { title: "我的" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  userStore.init();

  const requiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth !== false
  );

  if (requiresAuth && !userStore.isLoggedIn) {
    next({ name: "Login", query: { redirect: to.fullPath } });
  } else if (
    !requiresAuth &&
    userStore.isLoggedIn &&
    (to.name === "Login" || to.name === "Register")
  ) {
    next({ name: "Dashboard" });
  } else {
    next();
  }
});

export default router;
