# 设计文档

## 概述

本设计文档描述了交易编辑增强功能的技术实现方案。该功能包含两个核心增强：

1. **账户修改功能**：在交易编辑对话框中添加账户选择器，允许用户修改已记录交易的账户，并自动处理账户余额的调整
2. **搜索功能**：在账户和分类选择器中添加搜索框，支持按名称快速筛选，提升大量数据场景下的用户体验

技术栈：Vue 3 Composition API + TypeScript + Element Plus + Sequelize

## 架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层 (Vue 3)                        │
├─────────────────────────────────────────────────────────────┤
│  TransactionList.vue (编辑对话框)                            │
│    ├─ AccountCardSelector.vue (增强：搜索功能)              │
│    └─ CategoryCardSelector.vue (增强：搜索功能)             │
│                                                              │
│  QuickAdd.vue (快速添加)                                     │
│    ├─ AccountCardSelector.vue (复用搜索功能)                │
│    └─ CategoryCardSelector.vue (复用搜索功能)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端层 (Express)                        │
├─────────────────────────────────────────────────────────────┤
│  PUT /api/transactions/:id                                   │
│    └─ TransactionController.update()                        │
│         └─ 数据库事务处理                                    │
│              ├─ 更新交易记录                                 │
│              ├─ 调整原账户余额                               │
│              └─ 调整新账户余额                               │
└─────────────────────────────────────────────────────────────┘
```

### 设计原则

1. **渐进式增强**：在现有组件基础上添加功能，不破坏现有逻辑
2. **组件复用**：搜索功能在账户和分类选择器中共享相同的实现模式
3. **响应式优先**：使用 Vue 3 响应式系统确保 UI 实时更新
4. **事务一致性**：账户余额调整必须在数据库事务中完成

## 组件和接口

### 1. AccountCardSelector 组件增强

**新增功能**：搜索框 + 实时过滤

**组件接口**：

```typescript
interface Props {
  modelValue: number | null; // 当前选中的账户 ID
  accounts: Account[]; // 账户列表
}

interface Emits {
  (e: "update:modelValue", value: number | null): void;
}
```

**新增内部状态**：

```typescript
const searchQuery = ref(""); // 搜索关键词
const filteredAccounts = computed(() => {
  if (!searchQuery.value.trim()) {
    return sortedAccounts.value;
  }
  const query = searchQuery.value.toLowerCase();
  return sortedAccounts.value.filter((account) =>
    account.name.toLowerCase().includes(query),
  );
});
```

**UI 结构**：

```
┌─────────────────────────────────────┐
│ 选择账户                             │
├─────────────────────────────────────┤
│ [🔍 搜索账户...]                     │  ← 新增搜索框
├─────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐               │
│ │现金│ │银行│ │支付│               │  ← 过滤后的卡片
│ └────┘ └────┘ └────┘               │
│ ┌────┐ ┌────┐                      │
│ │微信│ │信用│                      │
│ └────┘ └────┘                      │
├─────────────────────────────────────┤
│ 展开全部 (10) ▼                     │
└─────────────────────────────────────┘
```

### 2. CategoryCardSelector 组件增强

**新增功能**：搜索框 + 实时过滤（与账户选择器相同模式）

**组件接口**：

```typescript
interface Props {
  modelValue: number | null; // 当前选中的分类 ID
  categories: Category[]; // 分类列表
}

interface Emits {
  (e: "update:modelValue", value: number | null): void;
}
```

**新增内部状态**：

```typescript
const searchQuery = ref(""); // 搜索关键词
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return sortedCategories.value;
  }
  const query = searchQuery.value.toLowerCase();
  return sortedCategories.value.filter((category) =>
    category.name.toLowerCase().includes(query),
  );
});
```

### 3. TransactionList 编辑对话框增强

**新增功能**：添加账户选择器

**编辑表单数据结构**：

```typescript
const editForm = reactive({
  id: number;
  amount: number;
  categoryId: number | null;
  accountId: number | null;  // 新增：账户 ID
  date: string;
  note: string;
});
```

**新增状态**：

```typescript
const accounts = computed(() => accountStore.accounts); // 账户列表
const originalAccountId = ref<number | null>(null); // 原始账户 ID（用于余额调整）
```

**编辑对话框 UI 结构**：

```
┌─────────────────────────────────────┐
│ 编辑交易                             │
├─────────────────────────────────────┤
│ 金额: [100.00]                      │
│                                      │
│ 分类: [CategoryCardSelector]        │
│                                      │
│ 账户: [AccountCardSelector]  ← 新增 │
│                                      │
│ 日期: [2024-01-15]                  │
│                                      │
│ 备注: [午餐]                         │
│                                      │
│ 附件: [AttachmentUpload]            │
├─────────────────────────────────────┤
│           [取消]  [保存]             │
└─────────────────────────────────────┘
```

### 4. 后端 API 增强

**现有 API**：`PUT /api/transactions/:id`

**请求体**：

```typescript
interface UpdateTransactionDto {
  amount?: number;
  categoryId?: number;
  accountId?: number; // 新增：支持修改账户
  date?: string;
  note?: string;
}
```

**响应体**：

```typescript
interface UpdateTransactionResponse {
  id: number;
  amount: number;
  type: "income" | "expense";
  categoryId: number;
  accountId: number;
  date: string;
  note: string;
  updatedAt: string;
}
```

## 数据模型

### Transaction 模型

```typescript
interface Transaction {
  id: number;
  amount: number;
  type: "income" | "expense" | "refund";
  categoryId: number;
  accountId: number; // 关联的账户 ID
  date: string;
  note: string;
  userId: number;
  createdAt: string;
  updatedAt: string;

  // 关联数据
  category?: Category;
  account?: Account;
}
```

### Account 模型

```typescript
interface Account {
  id: number;
  name: string;
  type:
    | "cash"
    | "bank"
    | "alipay"
    | "wechat"
    | "credit"
    | "investment"
    | "other";
  balance: number; // 当前余额
  userId: number;
  createdAt: string;
  updatedAt: string;
}
```

### 账户余额调整逻辑

当交易的账户从 A 变更为 B 时：

**支出类型交易**：

- 原账户 A：`balance += transaction.amount`（退回金额）
- 新账户 B：`balance -= transaction.amount`（扣除金额）

**收入类型交易**：

- 原账户 A：`balance -= transaction.amount`（撤回收入）
- 新账户 B：`balance += transaction.amount`（增加收入）

**退款类型交易**：

- 原账户 A：`balance -= transaction.amount`（撤回退款）
- 新账户 B：`balance += transaction.amount`（增加退款）

### 数据库事务伪代码

```typescript
async function updateTransactionWithAccountChange(
  transactionId: number,
  newAccountId: number,
  userId: number,
) {
  return await sequelize.transaction(async (t) => {
    // 1. 获取原交易记录（加锁）
    const transaction = await Transaction.findByPk(transactionId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!transaction) {
      throw new Error("交易不存在");
    }

    const oldAccountId = transaction.accountId;
    const amount = transaction.amount;
    const type = transaction.type;

    // 2. 如果账户未变更，直接返回
    if (oldAccountId === newAccountId) {
      return transaction;
    }

    // 3. 调整原账户余额
    const oldAccount = await Account.findByPk(oldAccountId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (type === "expense") {
      oldAccount.balance += amount; // 退回支出
    } else {
      oldAccount.balance -= amount; // 撤回收入/退款
    }
    await oldAccount.save({ transaction: t });

    // 4. 调整新账户余额
    const newAccount = await Account.findByPk(newAccountId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (type === "expense") {
      newAccount.balance -= amount; // 扣除支出
    } else {
      newAccount.balance += amount; // 增加收入/退款
    }
    await newAccount.save({ transaction: t });

    // 5. 更新交易记录
    transaction.accountId = newAccountId;
    await transaction.save({ transaction: t });

    return transaction;
  });
}
```

## 正确性属性

属性是一种特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。

### 属性 1：账户变更时余额调整的正确性

*对于任意*交易（支出、收入或退款类型）和任意两个不同的账户（原账户和新账户），当修改交易的账户时，系统应该：

- 根据交易类型正确调整原账户余额（支出类型增加，收入/退款类型减少）
- 根据交易类型正确调整新账户余额（支出类型减少，收入/退款类型增加）
- 确保两个账户的余额变化总和为零（守恒定律）

**验证：需求 1.4, 1.5, 1.6**

### 属性 2：账户搜索过滤的正确性

*对于任意*搜索关键词和账户列表，搜索过滤后的结果应该：

- 只包含名称中包含搜索关键词的账户（不区分大小写）
- 保持原有的排序顺序
- 当关键词为空时，返回完整的账户列表

**验证：需求 2.2, 2.3, 2.5**

### 属性 3：分类搜索过滤的正确性

*对于任意*搜索关键词和分类列表，搜索过滤后的结果应该：

- 只包含名称中包含搜索关键词的分类（不区分大小写）
- 保持原有的排序顺序
- 当关键词为空时，返回完整的分类列表

**验证：需求 3.2, 3.3, 3.5**

### 属性 4：搜索不影响选择功能

*对于任意*搜索关键词和选择器（账户或分类），在搜索结果中选择项目应该：

- 触发与未搜索时相同的选择事件
- 传递正确的项目 ID
- 更新父组件的 v-model 值

**验证：需求 2.6, 3.6**

### 属性 5：交易更新失败时的回滚

*对于任意*交易更新操作，如果更新过程中发生错误（如网络故障、验证失败），系统应该：

- 回滚所有已执行的余额变更
- 保持原账户和新账户的余额不变
- 保持交易记录不变

**验证：需求 4.1**

### 属性 6：编辑表单数据绑定的正确性

*对于任意*交易记录，当打开编辑对话框时，表单应该：

- 正确显示交易的所有字段（金额、分类、账户、日期、备注）
- 账户选择器应该预选当前交易的账户
- 修改账户后，表单数据应该实时更新

**验证：需求 1.2, 1.3**

## 错误处理

### 前端错误处理

1. **账户列表为空**
   - 显示提示信息："暂无账户，请先创建账户"
   - 禁用保存按钮

2. **搜索无结果**
   - 账户选择器：显示"未找到匹配的账户"
   - 分类选择器：显示"未找到匹配的分类"
   - 保持搜索框可编辑，允许用户修改关键词

3. **网络请求失败**
   - 使用 ElMessage 显示错误提示
   - 保持对话框打开，允许用户重试
   - 不清空表单数据

4. **表单验证失败**
   - 高亮显示错误字段
   - 显示具体的验证错误信息
   - 阻止表单提交

### 后端错误处理

1. **交易不存在**
   - HTTP 404
   - 错误信息："交易记录不存在"

2. **账户不存在**
   - HTTP 404
   - 错误信息："账户不存在"

3. **权限不足**
   - HTTP 403
   - 错误信息："无权修改此交易"

4. **数据库事务失败**
   - HTTP 500
   - 错误信息："更新失败，请稍后重试"
   - 自动回滚所有变更

5. **并发冲突**
   - HTTP 409
   - 错误信息："交易已被其他操作修改，请刷新后重试"

6. **余额不足（信用卡等场景）**
   - HTTP 400
   - 错误信息："账户余额不足"

## 测试策略

### 双重测试方法

本功能采用单元测试和基于属性的测试相结合的策略：

- **单元测试**：验证特定示例、边界情况和错误条件
- **属性测试**：验证跨所有输入的通用属性
- 两者互补，共同确保全面覆盖

### 前端测试

#### 单元测试（Vitest + Vue Test Utils）

1. **AccountCardSelector 组件**
   - 搜索框渲染测试
   - 空搜索结果提示测试
   - 搜索框清空后恢复列表测试
   - 选择事件触发测试

2. **CategoryCardSelector 组件**
   - 搜索框渲染测试
   - 空搜索结果提示测试
   - 搜索框清空后恢复列表测试
   - 选择事件触发测试

3. **TransactionList 编辑对话框**
   - 账户选择器渲染测试
   - 表单数据绑定测试
   - 账户变更时表单更新测试

#### 属性测试（fast-check）

每个属性测试配置为最少 100 次迭代。

1. **属性 2：账户搜索过滤**
   - 生成随机账户列表和搜索关键词
   - 验证过滤结果的正确性
   - 标签：**Feature: transaction-edit-enhancement, Property 2: 账户搜索过滤的正确性**

2. **属性 3：分类搜索过滤**
   - 生成随机分类列表和搜索关键词
   - 验证过滤结果的正确性
   - 标签：**Feature: transaction-edit-enhancement, Property 3: 分类搜索过滤的正确性**

3. **属性 4：搜索不影响选择功能**
   - 生成随机搜索场景
   - 验证选择事件的正确性
   - 标签：**Feature: transaction-edit-enhancement, Property 4: 搜索不影响选择功能**

### 后端测试

#### 单元测试（Jest + Supertest）

1. **账户变更 API 测试**
   - 成功更新账户测试
   - 交易不存在测试
   - 账户不存在测试
   - 权限验证测试

2. **余额调整测试**
   - 支出类型余额调整测试
   - 收入类型余额调整测试
   - 退款类型余额调整测试

3. **错误处理测试**
   - 数据库事务失败测试
   - 并发冲突测试
   - 余额不足测试

#### 属性测试（fast-check）

每个属性测试配置为最少 100 次迭代。

1. **属性 1：账户变更时余额调整的正确性**
   - 生成随机交易和账户
   - 验证余额调整的守恒定律
   - 标签：**Feature: transaction-edit-enhancement, Property 1: 账户变更时余额调整的正确性**

2. **属性 5：交易更新失败时的回滚**
   - 模拟随机失败场景
   - 验证余额回滚的正确性
   - 标签：**Feature: transaction-edit-enhancement, Property 5: 交易更新失败时的回滚**

3. **属性 6：编辑表单数据绑定的正确性**
   - 生成随机交易数据
   - 验证表单数据的正确绑定
   - 标签：**Feature: transaction-edit-enhancement, Property 6: 编辑表单数据绑定的正确性**

### 集成测试

1. **端到端流程测试**
   - 打开编辑对话框 → 修改账户 → 保存 → 验证余额
   - 使用搜索功能 → 选择账户 → 验证选择结果

2. **并发场景测试**
   - 模拟多个用户同时修改同一交易
   - 验证数据一致性

### 测试库选择

- **前端属性测试**：fast-check（JavaScript/TypeScript 的属性测试库）
- **后端属性测试**：fast-check（Node.js 环境）
- **单元测试**：Vitest（前端）、Jest（后端）
- **E2E 测试**：Playwright（可选）

### 测试覆盖率目标

- 单元测试覆盖率：≥ 80%
- 属性测试：每个属性至少 100 次迭代
- 关键路径（账户变更 + 余额调整）：100% 覆盖
