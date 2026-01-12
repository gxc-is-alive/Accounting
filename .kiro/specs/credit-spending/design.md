# 设计文档：提前支出功能

## 概述

提前支出功能扩展现有的账户系统，为信用类账户（信用卡、花呗、白条等）提供完整的生命周期管理。核心设计理念是：

1. **最小侵入性** - 复用现有的 Account 和 Transaction 模型，通过扩展字段支持信用账户特性
2. **数据一致性** - 确保消费、还款操作的原子性，待还金额和可用额度始终保持正确
3. **渐进式体验** - 信用账户的额外功能对普通账户透明，不影响现有功能

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  Views                    │  Components                      │
│  ├─ AccountManage.vue     │  ├─ CreditAccountCard.vue       │
│  ├─ RepaymentView.vue     │  ├─ RepaymentForm.vue           │
│  └─ DashboardView.vue     │  └─ RepaymentReminder.vue       │
├─────────────────────────────────────────────────────────────┤
│  Stores                   │  Composables                     │
│  └─ account.ts (扩展)     │  └─ useCreditAccount.ts         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  Controllers              │  Services                        │
│  ├─ account.controller    │  ├─ account.service (扩展)      │
│  └─ repayment.controller  │  ├─ repayment.service (新增)    │
│                           │  └─ credit.service (新增)       │
├─────────────────────────────────────────────────────────────┤
│  Models                                                      │
│  └─ Account.ts (扩展 creditLimit, billingDay, dueDay 等)    │
└─────────────────────────────────────────────────────────────┘
```

## 组件和接口

### 数据模型扩展

#### Account 模型扩展

```typescript
// 信用账户扩展字段（存储在 Account 表的新字段中）
interface CreditAccountFields {
  creditLimit: number; // 信用额度
  billingDay: number; // 账单日 (1-28)
  dueDay: number; // 还款日 (1-28)
  outstandingBalance: number; // 待还金额（计算字段，基于交易记录）
}

// 扩展后的账户类型
type AccountType = "cash" | "bank" | "alipay" | "wechat" | "credit" | "other";

// 判断是否为信用账户
function isCreditAccount(account: Account): boolean {
  return account.type === "credit";
}
```

#### 还款交易类型

```typescript
// 交易类型扩展
type TransactionType = "income" | "expense" | "repayment";

// 还款交易的特殊字段
interface RepaymentTransaction {
  type: "repayment";
  accountId: number; // 信用账户 ID
  sourceAccountId: number; // 还款来源账户 ID
  amount: number; // 还款金额
}
```

### 服务层接口

#### CreditService

```typescript
interface CreditService {
  // 计算可用额度
  calculateAvailableCredit(account: CreditAccount): number;

  // 获取待还金额（基于交易记录计算）
  getOutstandingBalance(accountId: number): Promise<number>;

  // 检查是否超额
  isOverLimit(accountId: number, amount: number): Promise<boolean>;

  // 获取即将到期的还款提醒
  getDueReminders(userId: number): Promise<DueReminder[]>;
}

interface DueReminder {
  accountId: number;
  accountName: string;
  outstandingBalance: number;
  dueDay: number;
  daysUntilDue: number;
  isOverdue: boolean;
}
```

#### RepaymentService

```typescript
interface RepaymentService {
  // 执行还款
  createRepayment(params: CreateRepaymentParams): Promise<RepaymentResult>;

  // 获取还款历史
  getRepaymentHistory(accountId: number): Promise<Transaction[]>;
}

interface CreateRepaymentParams {
  creditAccountId: number; // 信用账户
  sourceAccountId: number; // 来源账户
  amount: number; // 还款金额
  date: Date; // 还款日期
  note?: string; // 备注
}

interface RepaymentResult {
  success: boolean;
  transaction?: Transaction;
  newOutstandingBalance: number;
  newAvailableCredit: number;
  error?: string;
}
```

### API 端点

```typescript
// 信用账户相关
POST   /api/accounts              // 创建账户（支持信用账户扩展字段）
PUT    /api/accounts/:id          // 更新账户
GET    /api/accounts/:id/credit   // 获取信用账户详情（含计算字段）

// 还款相关
POST   /api/repayments            // 创建还款
GET    /api/repayments            // 获取还款历史
GET    /api/credit/reminders      // 获取还款提醒
```

### 前端组件

#### CreditAccountCard

显示信用账户卡片，包含：

- 账户名称和图标
- 信用额度 / 可用额度
- 待还金额
- 账单日和还款日
- 快捷还款按钮

#### RepaymentForm

还款表单组件：

- 选择信用账户
- 选择还款来源账户
- 输入还款金额（支持全额还款快捷按钮）
- 显示还款后的预计余额

#### RepaymentReminder

还款提醒组件（显示在仪表盘）：

- 即将到期的还款列表
- 逾期警告样式
- 快捷还款入口

## 数据模型

### 数据库表结构变更

```sql
-- 扩展 accounts 表
ALTER TABLE accounts ADD COLUMN credit_limit DECIMAL(15,2) DEFAULT NULL;
ALTER TABLE accounts ADD COLUMN billing_day TINYINT DEFAULT NULL;
ALTER TABLE accounts ADD COLUMN due_day TINYINT DEFAULT NULL;

-- 扩展 transactions 表（支持还款类型）
ALTER TABLE transactions MODIFY COLUMN type ENUM('income', 'expense', 'repayment');
ALTER TABLE transactions ADD COLUMN source_account_id INT UNSIGNED DEFAULT NULL;
ALTER TABLE transactions ADD CONSTRAINT fk_source_account
  FOREIGN KEY (source_account_id) REFERENCES accounts(id);
```

### 待还金额计算逻辑

待还金额不存储在数据库中，而是实时计算：

```typescript
async function calculateOutstandingBalance(accountId: number): Promise<number> {
  // 获取所有使用该信用账户的支出交易
  const expenses = await Transaction.sum("amount", {
    where: {
      accountId,
      type: "expense",
    },
  });

  // 获取所有该信用账户的还款交易
  const repayments = await Transaction.sum("amount", {
    where: {
      accountId,
      type: "repayment",
    },
  });

  // 待还金额 = 总支出 - 总还款
  return Math.max(0, (expenses || 0) - (repayments || 0));
}
```

### 可用额度计算

```typescript
function calculateAvailableCredit(
  creditLimit: number,
  outstandingBalance: number
): number {
  // 可用额度 = 信用额度 - 待还金额
  // 如果待还金额为负（溢缴款），可用额度会超过信用额度
  return creditLimit - outstandingBalance;
}
```

## 正确性属性

_正确性属性是系统在所有有效执行中都应保持为真的特征或行为。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。_

### Property 1: 可用额度计算一致性

_对于任意_ 信用账户，可用额度应始终等于信用额度减去待还金额。

```
availableCredit = creditLimit - outstandingBalance
```

**验证: 需求 4.1, 4.2**

### Property 2: 还款金额守恒

_对于任意_ 还款操作，信用账户待还金额的减少量应等于来源账户余额的减少量，且等于还款金额。

```
Δ(outstandingBalance) = -amount
Δ(sourceAccount.balance) = -amount
```

**验证: 需求 3.3, 3.4, 3.5**

### Property 3: 消费金额守恒

_对于任意_ 信用消费操作，待还金额的增加量应等于消费金额。

```
Δ(outstandingBalance) = +expenseAmount
```

**验证: 需求 2.1, 2.2**

### Property 4: 待还金额非负性

_对于任意_ 信用账户，待还金额应始终大于等于 0。

```
outstandingBalance >= 0
```

**验证: 需求 4.4**

### Property 5: 还款来源余额充足性

_对于任意_ 成功的还款操作，还款金额不应超过来源账户的余额。

```
repaymentAmount <= sourceAccount.balance
```

**验证: 需求 3.2, 3.8**

### Property 6: 数据序列化往返一致性

_对于任意_ 有效的信用账户对象，序列化为 JSON 后再反序列化应产生等价的对象。

```
deserialize(serialize(creditAccount)) ≡ creditAccount
```

**验证: 需求 7.3**

### Property 7: 还款提醒准确性

_对于任意_ 待还金额大于 0 且距离还款日不足 3 天的信用账户，应出现在还款提醒列表中。

**验证: 需求 5.1, 5.2**

## 错误处理

### 业务错误

| 错误码                 | 错误信息         | 触发条件                           |
| ---------------------- | ---------------- | ---------------------------------- |
| INSUFFICIENT_BALANCE   | 来源账户余额不足 | 还款金额超过来源账户余额           |
| INVALID_CREDIT_ACCOUNT | 无效的信用账户   | 对非信用账户执行还款操作           |
| INVALID_SOURCE_ACCOUNT | 无效的来源账户   | 来源账户为信用账户                 |
| INVALID_AMOUNT         | 无效的金额       | 还款金额小于等于 0                 |
| OVER_CREDIT_LIMIT      | 超出信用额度     | 消费后可用额度为负（警告，不阻止） |

### 错误处理策略

```typescript
class CreditError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "CreditError";
  }
}

// 使用示例
if (sourceAccount.balance < amount) {
  throw new CreditError("INSUFFICIENT_BALANCE", "来源账户余额不足", {
    available: sourceAccount.balance,
    required: amount,
  });
}
```

## 测试策略

### 单元测试

- 可用额度计算函数
- 待还金额计算函数
- 还款日期计算（距离还款日天数）
- 输入验证函数

### 属性测试

使用 fast-check 进行属性测试，每个属性测试至少运行 100 次迭代。

```typescript
// 示例：可用额度计算一致性
// Feature: credit-spending, Property 1: 可用额度计算一致性
fc.assert(
  fc.property(
    fc.nat(1000000), // creditLimit
    fc.nat(1000000), // outstandingBalance
    (creditLimit, outstandingBalance) => {
      const available = calculateAvailableCredit(
        creditLimit,
        outstandingBalance
      );
      return available === creditLimit - outstandingBalance;
    }
  ),
  { numRuns: 100 }
);
```

### 集成测试

- 完整还款流程（创建还款 → 验证余额变化 → 验证交易记录）
- 信用消费流程（创建消费 → 验证待还金额 → 验证可用额度）
- 还款提醒生成逻辑

### 测试框架

- 后端: Jest + fast-check
- 前端: Vitest + fast-check
