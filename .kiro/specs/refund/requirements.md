# 需求文档

## 简介

退款功能允许用户记录购物退款、服务退款等场景，将之前的支出金额退回到账户中。退款与原支出交易关联，系统自动处理账户余额的恢复，并在统计报表中正确反映退款对支出的抵消效果。

## 术语表

- **Refund_Transaction**: 退款交易记录，表示一笔退款操作
- **Original_Transaction**: 原始支出交易，即被退款的那笔支出记录
- **Account**: 账户，包括现金、银行卡、支付宝、微信、信用卡等
- **Credit_Account**: 信用账户，退款时减少待还金额而非增加余额
- **Partial_Refund**: 部分退款，退款金额小于原交易金额
- **Full_Refund**: 全额退款，退款金额等于原交易金额
- **Refundable_Amount**: 可退款金额，原交易金额减去已退款金额

## 需求

### 需求 1：创建退款交易

**用户故事：** 作为用户，我想要记录一笔退款，以便准确追踪我的实际支出和账户余额。

#### 验收标准

1. WHEN 用户选择一笔支出交易并发起退款 THEN THE Refund_Transaction SHALL 创建一条类型为 refund 的交易记录，并关联到原始交易
2. WHEN 用户输入退款金额 THEN THE System SHALL 验证退款金额不超过可退款金额（原交易金额 - 已退款金额）
3. WHEN 退款金额超过可退款金额 THEN THE System SHALL 拒绝创建退款并返回错误提示
4. WHEN 退款交易创建成功 THEN THE System SHALL 自动更新相关账户的余额
5. WHEN 对非信用账户的支出进行退款 THEN THE Account SHALL 增加相应的退款金额
6. WHEN 对信用账户的支出进行退款 THEN THE Credit_Account SHALL 减少相应的待还金额

### 需求 2：退款金额验证

**用户故事：** 作为用户，我想要系统防止我退款超过原支出金额，以避免记账错误。

#### 验收标准

1. THE System SHALL 计算每笔支出交易的可退款金额为：原交易金额 - 已退款总额
2. WHEN 可退款金额为零 THEN THE System SHALL 禁止对该交易发起新的退款
3. WHEN 用户尝试退款金额为负数或零 THEN THE System SHALL 拒绝并提示金额必须为正数
4. FOR ALL 退款交易，退款金额 SHALL 大于零且小于等于可退款金额

### 需求 3：退款与原交易关联

**用户故事：** 作为用户，我想要查看某笔支出的退款历史，以便了解该笔支出的实际净支出。

#### 验收标准

1. THE Refund_Transaction SHALL 存储原始交易 ID（originalTransactionId）
2. WHEN 查询原始交易详情 THEN THE System SHALL 返回该交易的所有关联退款记录
3. WHEN 查询原始交易详情 THEN THE System SHALL 计算并返回已退款总额和剩余可退款金额
4. WHEN 原始交易被删除 THEN THE System SHALL 同时删除所有关联的退款记录

### 需求 4：退款对统计的影响

**用户故事：** 作为用户，我想要在月度/年度报表中看到退款对支出的抵消效果，以便了解真实的净支出。

#### 验收标准

1. WHEN 计算月度支出统计 THEN THE System SHALL 从总支出中扣除该月的退款金额
2. WHEN 计算分类支出统计 THEN THE System SHALL 将退款金额从对应分类的支出中扣除
3. WHEN 显示交易列表 THEN THE System SHALL 将退款交易标记为特殊类型以便区分
4. THE System SHALL 在统计报表中分别显示：总支出、总退款、净支出（总支出 - 总退款）

### 需求 5：退款交易管理

**用户故事：** 作为用户，我想要查看、编辑和删除退款记录，以便修正错误的退款信息。

#### 验收标准

1. WHEN 用户查看交易列表 THEN THE System SHALL 显示退款交易并标明其关联的原始交易
2. WHEN 用户编辑退款交易的金额 THEN THE System SHALL 重新验证金额不超过可退款金额
3. WHEN 用户删除退款交易 THEN THE System SHALL 恢复账户余额（减少之前增加的退款金额）
4. WHEN 用户删除退款交易 THEN THE System SHALL 更新原始交易的可退款金额

### 需求 6：退款用户界面

**用户故事：** 作为用户，我想要通过简单直观的界面发起退款，以便快速记录退款信息。

#### 验收标准

1. WHEN 用户在交易详情页查看支出交易 THEN THE System SHALL 显示"退款"按钮（如果可退款金额大于零）
2. WHEN 用户点击退款按钮 THEN THE System SHALL 显示退款表单，预填原交易信息
3. WHEN 显示退款表单 THEN THE System SHALL 显示原交易金额、已退款金额、可退款金额
4. WHEN 用户在交易列表筛选 THEN THE System SHALL 支持按退款类型筛选交易
5. WHEN 显示退款交易 THEN THE System SHALL 使用特殊图标或颜色标识退款记录
