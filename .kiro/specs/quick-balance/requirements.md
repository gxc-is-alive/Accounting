# 需求文档

## 简介

快速平账功能允许用户输入账户的实际总额，系统自动计算与当前记录值的差异，并生成一笔调整交易来平账。适用于基金等市值会变动的账户，用户无需每天记录，只需定期（如每月）输入实际总额即可完成对账。

## 术语表

- **Account**: 账户，记录资金余额的实体
- **Balance_Adjustment**: 余额调整，用于平账的交易记录
- **Current_Balance**: 当前余额，系统中记录的账户余额
- **Actual_Balance**: 实际余额，用户输入的账户真实总额
- **Difference**: 差额，实际余额与当前余额的差值

## 需求

### 需求 1：快速平账

**用户故事：** 作为用户，我想输入账户的实际总额来快速平账，以便无需手动计算差额即可更新账户余额。

#### 验收标准

1. WHEN 用户选择账户并输入实际总额 THEN Balance_Adjustment SHALL 显示当前余额和差额预览
2. WHEN 差额为正数（实际 > 当前）THEN Balance_Adjustment SHALL 显示为"盈利"或"增值"
3. WHEN 差额为负数（实际 < 当前）THEN Balance_Adjustment SHALL 显示为"亏损"或"减值"
4. WHEN 差额为零 THEN Balance_Adjustment SHALL 提示"余额一致，无需调整"
5. WHEN 用户确认平账 THEN Account SHALL 将余额更新为实际总额
6. WHEN 平账完成 THEN Balance_Adjustment SHALL 创建一笔调整交易记录，包含调整前余额、调整后余额、差额和调整时间

### 需求 2：平账记录查询

**用户故事：** 作为用户，我想查看历史平账记录，以便了解账户的市值变动情况。

#### 验收标准

1. WHEN 用户查看平账记录 THEN Balance_Adjustment SHALL 显示调整时间、账户名称、调整前余额、调整后余额和差额
2. WHEN 用户按账户筛选 THEN Balance_Adjustment SHALL 只显示该账户的平账记录
3. WHEN 用户按时间范围筛选 THEN Balance_Adjustment SHALL 只显示该时间段内的平账记录

### 需求 3：快速入口

**用户故事：** 作为用户，我想从账户详情页快速进入平账功能，以便方便地进行对账操作。

#### 验收标准

1. WHEN 用户在账户详情页 THEN Account SHALL 显示"快速平账"按钮
2. WHEN 用户点击"快速平账"按钮 THEN Balance_Adjustment SHALL 打开平账表单并自动填充当前账户信息
