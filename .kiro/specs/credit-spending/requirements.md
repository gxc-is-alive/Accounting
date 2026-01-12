# 需求文档

## 简介

提前支出功能用于管理信用类账户（如信用卡、花呗、白条等）的消费和还款。这类账户的特点是：先消费后还款，有账单周期、还款日、信用额度等概念。系统需要追踪待还金额、支持还款操作、提供账单提醒等功能。

## 术语表

- **Credit_Account**: 信用账户，指信用卡、花呗、白条等提前支出类型的账户
- **Credit_Limit**: 信用额度，信用账户的最大可用额度
- **Outstanding_Balance**: 待还金额，当前需要还款的总金额
- **Available_Credit**: 可用额度，等于信用额度减去待还金额
- **Billing_Day**: 账单日，每月生成账单的日期
- **Due_Day**: 还款日，每月需要完成还款的截止日期
- **Billing_Cycle**: 账单周期，从上一个账单日到当前账单日之间的消费周期
- **Repayment**: 还款，用户向信用账户支付款项以减少待还金额
- **Source_Account**: 还款来源账户，用于支付还款的现金类账户
- **Credit_Transaction**: 信用消费，使用信用账户进行的支出交易

## 需求

### 需求 1：信用账户管理

**用户故事：** 作为用户，我想要创建和管理信用账户，以便追踪我的信用卡、花呗等提前支出工具。

#### 验收标准

1. WHEN 用户创建信用账户 THEN Credit_Account_Manager SHALL 要求输入账户名称、信用额度、账单日和还款日
2. WHEN 信用账户创建成功 THEN Credit_Account_Manager SHALL 初始化待还金额为 0，可用额度等于信用额度
3. WHEN 用户编辑信用账户 THEN Credit_Account_Manager SHALL 允许修改账户名称、信用额度、账单日和还款日
4. WHEN 用户查看信用账户列表 THEN Credit_Account_Manager SHALL 显示每个账户的名称、待还金额、可用额度和还款日
5. WHEN 用户删除信用账户 THEN Credit_Account_Manager SHALL 检查是否有未还清的待还金额并提示用户确认

### 需求 2：信用消费记录

**用户故事：** 作为用户，我想要记录使用信用账户的消费，以便追踪我的提前支出情况。

#### 验收标准

1. WHEN 用户使用信用账户记录支出 THEN Transaction_Manager SHALL 增加该账户的待还金额
2. WHEN 信用消费记录成功 THEN Transaction_Manager SHALL 减少该账户的可用额度
3. WHEN 用户尝试记录超过可用额度的消费 THEN Transaction_Manager SHALL 显示警告但允许继续（超额消费）
4. WHEN 信用消费被删除 THEN Transaction_Manager SHALL 减少待还金额并增加可用额度
5. WHEN 信用消费被修改 THEN Transaction_Manager SHALL 相应调整待还金额和可用额度

### 需求 3：还款功能

**用户故事：** 作为用户，我想要对信用账户进行还款，以便减少我的待还金额。

#### 验收标准

1. WHEN 用户发起还款 THEN Repayment_Manager SHALL 要求选择信用账户、还款来源账户和还款金额
2. WHEN 还款金额大于 0 且不超过来源账户余额 THEN Repayment_Manager SHALL 执行还款操作
3. WHEN 还款成功 THEN Repayment_Manager SHALL 减少信用账户的待还金额
4. WHEN 还款成功 THEN Repayment_Manager SHALL 增加信用账户的可用额度
5. WHEN 还款成功 THEN Repayment_Manager SHALL 减少来源账户的余额
6. WHEN 还款成功 THEN Repayment_Manager SHALL 创建一条还款类型的交易记录
7. IF 还款金额超过待还金额 THEN Repayment_Manager SHALL 将超出部分作为溢缴款增加可用额度
8. IF 还款金额超过来源账户余额 THEN Repayment_Manager SHALL 拒绝操作并显示余额不足提示

### 需求 4：账户余额计算

**用户故事：** 作为用户，我想要准确了解我的信用账户状态，以便做出合理的消费决策。

#### 验收标准

1. THE Credit_Calculator SHALL 计算可用额度为：信用额度 - 待还金额 + 溢缴款
2. WHEN 待还金额发生变化 THEN Credit_Calculator SHALL 自动重新计算可用额度
3. WHEN 用户查看账户详情 THEN Credit_Calculator SHALL 显示信用额度、待还金额、可用额度
4. THE Credit_Calculator SHALL 确保待还金额不会为负数（最小为 0）

### 需求 5：还款提醒

**用户故事：** 作为用户，我想要收到还款提醒，以便避免逾期还款。

#### 验收标准

1. WHEN 当前日期距离还款日不足 3 天 THEN Reminder_Service SHALL 在仪表盘显示还款提醒
2. WHEN 存在待还金额大于 0 的信用账户 THEN Reminder_Service SHALL 在提醒中显示账户名称和待还金额
3. WHEN 当前日期已过还款日且仍有待还金额 THEN Reminder_Service SHALL 显示逾期警告
4. WHEN 用户完成全额还款 THEN Reminder_Service SHALL 移除该账户的还款提醒

### 需求 6：信用消费统计

**用户故事：** 作为用户，我想要查看信用消费的统计数据，以便了解我的提前支出习惯。

#### 验收标准

1. WHEN 用户查看月度统计 THEN Statistics_Service SHALL 单独显示信用消费总额
2. WHEN 用户查看账户统计 THEN Statistics_Service SHALL 显示每个信用账户的消费金额和还款金额
3. WHEN 用户查看趋势图 THEN Statistics_Service SHALL 支持筛选仅显示信用消费数据
4. THE Statistics_Service SHALL 区分信用消费和普通支出在统计报表中的展示

### 需求 7：数据持久化

**用户故事：** 作为系统，我需要正确存储信用账户数据，以便数据不会丢失。

#### 验收标准

1. WHEN 信用账户数据保存到数据库 THEN Persistence_Layer SHALL 使用 JSON 格式存储扩展字段
2. WHEN 从数据库读取信用账户 THEN Persistence_Layer SHALL 正确解析并返回完整的账户信息
3. FOR ALL 有效的信用账户对象，序列化后再反序列化 SHALL 产生等价的对象（往返一致性）
