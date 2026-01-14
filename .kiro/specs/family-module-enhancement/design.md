# 设计文档：家庭模块完善

## 概述

本设计文档描述家庭模块的完善方案，主要解决 PC 端和移动端家庭概览显示问题，并增强家庭账户和交易列表功能。系统采用现有的前后端分离架构，后端 API 已基本完善，主要工作集中在前端组件的修复和增强。

### 技术栈

**前端：**

- Vue 3 + Composition API
- TypeScript
- Element Plus（UI 组件库）
- Pinia（状态管理）

**后端：**

- Node.js + Express
- TypeScript
- MySQL + Sequelize ORM

## 架构

```mermaid
graph TB
    subgraph Frontend["前端组件"]
        Dashboard[DashboardView]
        FamilyManage[FamilyManage]
        FamilyTransactions[FamilyTransactions]
        FamilyOverviewCard[FamilyOverviewCard]
        FamilyAssetsCard[FamilyAssetsCard]
    end

    subgraph API["后端 API"]
        FamilyAPI[/families]
        StatisticsAPI[/statistics/family/:id]
        TransactionAPI[/transactions/family/:familyId]
    end

    subgraph Services["后端服务"]
        FamilyService[FamilyService]
        StatisticsService[StatisticsService]
    end

    Dashboard --> FamilyOverviewCard
    FamilyManage --> FamilyAPI
    FamilyTransactions --> TransactionAPI
    FamilyOverviewCard --> StatisticsAPI
    FamilyOverviewCard --> FamilyAPI

    FamilyAPI --> FamilyService
    StatisticsAPI --> StatisticsService
    TransactionAPI --> StatisticsService
```

## 组件与接口

### 现有后端 API（已实现）

#### 家庭概览 API

```typescript
// GET /api/statistics/family/:id/overview
// 获取家庭概览统计
interface FamilyOverviewResponse {
  familyId: number;
  familyName: string;
  period: { year: number; month: number };
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalAssets: number;
  memberCount: number;
  memberContributions: MemberContribution[];
}

interface MemberContribution {
  userId: number;
  nickname: string;
  income: number;
  expense: number;
  incomePercentage: number;
  expensePercentage: number;
}
```

#### 家庭资产 API

```typescript
// GET /api/statistics/family/:id/assets
// 获取家庭总资产
interface FamilyAssetsResponse {
  familyId: number;
  totalAssets: number;
  byAccountType: Array<{
    type: string;
    typeName: string;
    total: number;
  }>;
  byMember: Array<{
    userId: number;
    nickname: string;
    accounts: Array<{
      id: number;
      name: string;
      type: string;
      balance: number;
    }>;
    totalBalance: number;
  }>;
}
```

#### 家庭交易 API

```typescript
// GET /api/transactions/family/:familyId
// 获取家庭交易列表（基于成员加入时间）
interface FamilyTransactionFilters {
  memberId?: number;
  categoryId?: number;
  type?: "income" | "expense";
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

interface FamilyTransactionResponse {
  items: FamilyTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

interface FamilyTransaction {
  id: number;
  userId: number;
  userNickname: string;
  amount: number;
  type: "income" | "expense";
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  accountId: number;
  accountName: string;
  date: string;
  note?: string;
  createdAt: string;
}
```

### 前端组件设计

#### FamilyOverviewCard 组件（修复）

```vue
<!-- 组件职责：在首页展示家庭概览 -->
<script setup lang="ts">
// Props
interface Props {
  initialFamilyId?: number;
}

// Emits
interface Emits {
  viewDetail: [];
  familyChange: [familyId: number];
}

// 状态
const loading = ref(false);
const families = ref<Family[]>([]);
const selectedFamilyId = ref<number | null>(null);
const overview = ref<FamilyOverview | null>(null);

// 方法
const loadFamilies = async () => {
  /* 加载家庭列表 */
};
const loadOverview = async () => {
  /* 加载家庭概览 */
};
const onFamilyChange = (familyId: number) => {
  /* 切换家庭 */
};
const refresh = async () => {
  /* 刷新数据 */
};
</script>
```

#### FamilyTransactions 页面（增强）

```vue
<!-- 页面职责：展示家庭交易列表 -->
<script setup lang="ts">
// 状态
const families = ref<Family[]>([]);
const selectedFamilyId = ref<number | null>(null);
const transactions = ref<FamilyTransaction[]>([]);
const members = ref<FamilyMember[]>([]);
const loading = ref(false);

// 筛选条件
const filters = ref<FamilyTransactionFilters>({
  memberId: undefined,
  categoryId: undefined,
  type: undefined,
  startDate: undefined,
  endDate: undefined,
  page: 1,
  pageSize: 20,
});

// 方法
const loadFamilies = async () => {
  /* 加载家庭列表 */
};
const loadMembers = async () => {
  /* 加载家庭成员 */
};
const loadTransactions = async () => {
  /* 加载交易列表 */
};
const onFilterChange = () => {
  /* 筛选条件变化 */
};
</script>
```

#### FamilyAssetsCard 组件（新增）

```vue
<!-- 组件职责：展示家庭资产详情 -->
<script setup lang="ts">
// Props
interface Props {
  familyId: number;
}

// 状态
const loading = ref(false);
const assets = ref<FamilyAssets | null>(null);

// 方法
const loadAssets = async () => {
  /* 加载资产数据 */
};
</script>
```

## 数据模型

### 现有数据模型（无需修改）

数据库模型已在 `family-accounting` spec 中定义，本次增强不需要修改数据库结构。

主要涉及的模型：

- `Family` - 家庭
- `FamilyMember` - 家庭成员（含 joinedAt 字段）
- `Transaction` - 交易记录
- `Account` - 账户
- `User` - 用户

### 前端类型定义（已存在）

```typescript
// frontend/src/types/index.ts 中已定义
interface FamilyOverview {
  /* ... */
}
interface FamilyAssets {
  /* ... */
}
interface FamilyTransaction {
  /* ... */
}
interface FamilyTransactionFilters {
  /* ... */
}
interface MemberContribution {
  /* ... */
}
```

## 错误处理

### 错误场景

1. **用户未加入家庭** - 不显示家庭概览卡片
2. **API 请求失败** - 显示错误提示，允许重试
3. **数据为空** - 显示空状态提示
4. **网络超时** - 显示加载失败提示

### 错误处理策略

```typescript
// 统一错误处理
const handleApiError = (error: unknown, defaultMessage: string) => {
  console.error(defaultMessage, error);
  ElMessage.error(defaultMessage);
};

// 加载状态管理
const withLoading = async <T>(
  loadingRef: Ref<boolean>,
  fn: () => Promise<T>
): Promise<T | null> => {
  loadingRef.value = true;
  try {
    return await fn();
  } catch (error) {
    return null;
  } finally {
    loadingRef.value = false;
  }
};
```

## 正确性属性

_正确性属性是系统在所有有效执行中都应保持为真的特征或行为。属性是人类可读规范和机器可验证正确性保证之间的桥梁。_

### Property 1: 家庭概览显示条件

_对于任意_ 用户状态，当用户已加入至少一个家庭时，Dashboard 应显示 FamilyOverviewCard；当用户未加入任何家庭时，Dashboard 不应显示 FamilyOverviewCard。

**Validates: Requirements 1.1, 1.2**

### Property 2: 家庭总资产计算正确性

_对于任意_ 家庭成员账户集合，家庭总资产应等于所有成员非信用账户余额之和，加上信用账户正余额（还款超额），不包含信用账户负余额（欠款）。

```
totalAssets = sum(非信用账户余额) + sum(信用账户正余额)
```

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: 成员加入时间过滤

_对于任意_ 家庭成员和交易记录集合，家庭收支统计只应包含成员加入日期之后的交易记录。对于每个成员，只有 `transaction.date >= member.joinedAt` 的交易才应被统计。

**Validates: Requirements 3.2, 6.2**

### Property 4: 成员支出占比总和

_对于任意_ 家庭成员贡献列表，所有成员的支出占比之和应等于 100%（允许浮点误差 ±0.01）。

```
sum(memberContributions.expensePercentage) ≈ 100
```

**Validates: Requirements 4.4**

### Property 5: 成员贡献排序

_对于任意_ 家庭成员贡献列表，成员应按支出金额降序排列。

```
for i in 0..n-1: memberContributions[i].expense >= memberContributions[i+1].expense
```

**Validates: Requirements 4.3**

### Property 6: 账户分组正确性

_对于任意_ 家庭资产数据，每个成员的账户余额小计应等于该成员所有账户余额之和，每个账户类型的汇总应等于该类型所有账户余额之和。

```
member.totalBalance = sum(member.accounts.balance)
accountType.total = sum(accounts.filter(type).balance)
```

**Validates: Requirements 5.4, 5.5**

### Property 7: 交易筛选正确性

_对于任意_ 筛选条件（成员、分类、类型、日期范围），返回的所有交易记录都应满足该筛选条件。

**Validates: Requirements 6.4**

### Property 8: 分页正确性

_对于任意_ 分页参数（page, pageSize），返回的交易记录数量应不超过 pageSize，且 total 应等于满足筛选条件的总记录数。

**Validates: Requirements 6.6**

### Property 9: 家庭选择器显示条件

_对于任意_ 用户家庭列表，当用户加入多个家庭时，FamilyOverviewCard 应显示家庭选择器；当用户只加入一个家庭时，不应显示家庭选择器。

**Validates: Requirements 8.1, 8.3**

### Property 10: 交易记录数据完整性

_对于任意_ 家庭交易记录，每条记录应包含记录人昵称、金额、分类名称、日期字段。

**Validates: Requirements 6.3**

## 测试策略

### 测试框架

- **前端单元测试**: Vitest + Vue Test Utils
- **前端属性测试**: fast-check
- **后端属性测试**: fast-check + Jest

### 双重测试方法

**单元测试**：

- 验证特定示例和边界条件
- 测试组件渲染和交互
- 测试错误处理逻辑

**属性测试**：

- 验证跨所有输入的通用属性
- 测试计算逻辑的正确性
- 测试数据过滤和排序逻辑

### 属性测试配置

- 每个属性测试最少运行 100 次迭代
- 每个属性测试必须引用设计文档中的属性
- 标签格式：**Feature: family-module-enhancement, Property {number}: {property_text}**

### 测试覆盖范围

1. **组件测试**

   - FamilyOverviewCard 渲染和数据加载
   - FamilyTransactions 筛选和分页
   - 移动端响应式布局

2. **计算逻辑测试**

   - 家庭总资产计算
   - 成员贡献占比计算
   - 成员加入时间过滤

3. **集成测试**
   - API 调用和数据绑定
   - 家庭切换和数据刷新
