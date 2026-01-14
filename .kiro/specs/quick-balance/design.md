# 设计文档

## 概述

快速平账功能允许用户输入账户的实际总额，系统自动计算差额并更新账户余额。这是一个简单的功能，主要涉及：

1. 差额计算和预览
2. 账户余额更新
3. 调整记录存储

## 架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   Database      │
│   Vue Component │     │   Controller    │     │   MySQL         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
   QuickBalance          BalanceAdjust          balance_adjustments
   Form.vue              Controller.ts          (新表)
                               │
                         BalanceAdjust
                         Service.ts
```

## 组件和接口

### 后端 API

#### 1. 预览平账差额

```
GET /api/accounts/:id/balance-preview?actualBalance=10000
```

响应：

```typescript
{
  accountId: number;
  accountName: string;
  currentBalance: number;
  actualBalance: number;
  difference: number; // 差额 = actualBalance - currentBalance
  differenceType: "profit" | "loss" | "none"; // 盈利/亏损/无变化
}
```

#### 2. 执行平账

```
POST /api/accounts/:id/quick-balance
```

请求体：

```typescript
{
  actualBalance: number;   // 实际总额
  note?: string;           // 备注（可选）
}
```

响应：

```typescript
{
  id: number;
  accountId: number;
  previousBalance: number;
  newBalance: number;
  difference: number;
  note?: string;
  createdAt: Date;
}
```

#### 3. 获取平账记录

```
GET /api/balance-adjustments?accountId=1&startDate=2024-01-01&endDate=2024-12-31
```

响应：

```typescript
{
  records: BalanceAdjustmentRecord[];
  total: number;
}
```

### 前端组件

#### QuickBalanceForm.vue

- 显示当前余额
- 输入实际总额
- 实时计算并显示差额预览
- 确认按钮执行平账

#### BalanceAdjustmentList.vue

- 显示平账历史记录
- 支持按账户和时间筛选

## 数据模型

### balance_adjustments 表

```sql
CREATE TABLE balance_adjustments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  account_id INT UNSIGNED NOT NULL,
  previous_balance DECIMAL(15, 2) NOT NULL,
  new_balance DECIMAL(15, 2) NOT NULL,
  difference DECIMAL(15, 2) NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

## 正确性属性

_正确性属性是对系统行为的形式化描述，用于验证实现是否符合需求。每个属性都是一个普遍量化的陈述，可以通过属性测试来验证。_

### Property 1: 差额计算正确性

_对于任意_ 当前余额和实际总额，差额应该等于 `actualBalance - currentBalance`
**Validates: Requirements 1.1**

### Property 2: 差额类型判断正确性

_对于任意_ 差额值：

- 当差额 > 0 时，类型应为 'profit'
- 当差额 < 0 时，类型应为 'loss'
- 当差额 = 0 时，类型应为 'none'
  **Validates: Requirements 1.2, 1.3, 1.4**

### Property 3: 平账后余额一致性

_对于任意_ 账户和实际总额，执行平账后，账户余额应该等于输入的实际总额
**Validates: Requirements 1.5**

### Property 4: 平账记录完整性

_对于任意_ 平账操作，创建的记录应满足：

- `previousBalance` 等于平账前的账户余额
- `newBalance` 等于输入的实际总额
- `difference` 等于 `newBalance - previousBalance`
  **Validates: Requirements 1.6**

### Property 5: 账户筛选正确性

_对于任意_ 账户筛选查询，返回的所有记录的 `accountId` 都应该等于筛选条件中的账户 ID
**Validates: Requirements 2.2**

### Property 6: 时间范围筛选正确性

_对于任意_ 时间范围筛选查询，返回的所有记录的 `createdAt` 都应该在指定的时间范围内
**Validates: Requirements 2.3**

## 错误处理

| 错误场景       | 错误信息             | HTTP 状态码 |
| -------------- | -------------------- | ----------- |
| 账户不存在     | "账户不存在"         | 404         |
| 实际总额为负数 | "实际总额不能为负数" | 400         |
| 未授权访问     | "无权访问该账户"     | 403         |

## 测试策略

### 单元测试

- 差额计算逻辑
- 差额类型判断逻辑
- 服务层业务逻辑

### 属性测试

- 使用 fast-check 进行属性测试
- 每个属性测试运行至少 100 次迭代
- 测试标签格式：**Feature: quick-balance, Property N: {property_text}**

### 集成测试

- API 端点测试
- 数据库事务测试
