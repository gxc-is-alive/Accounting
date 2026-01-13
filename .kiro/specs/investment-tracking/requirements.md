# 需求文档

## 简介

投资追踪功能允许用户管理基金、股票等投资类资产。用户只需记录买入/卖出操作和定期更新净值，系统自动计算收益情况，无需每天手动记录盈亏。

## 术语表

- **Investment_Account**: 投资账户，一种特殊的账户类型，用于追踪基金、股票等投资资产
- **Net_Value**: 净值，投资产品的当前单位价值
- **Position**: 持仓，用户持有的投资产品份额
- **Cost_Basis**: 成本基础，用户购买投资产品的总成本
- **Profit_Loss**: 盈亏，当前市值与成本基础的差额
- **Valuation_Record**: 估值记录，记录某一时间点的净值和市值

## 需求

### 需求 1：投资账户管理

**用户故事：** 作为用户，我想要创建和管理投资账户，以便追踪我的基金、股票等投资资产。

#### 验收标准

1. WHEN 用户创建账户时选择"投资"类型 THEN Investment_Account SHALL 显示投资专属字段（产品名称、持仓份额、成本价）
2. WHEN 用户查看投资账户列表 THEN Investment_Account SHALL 显示当前市值、持仓份额、盈亏金额和盈亏比例
3. WHEN 用户编辑投资账户 THEN Investment_Account SHALL 允许修改产品名称和图标
4. WHEN 用户删除投资账户 THEN Investment_Account SHALL 同时删除关联的估值记录

### 需求 2：买入/卖出操作

**用户故事：** 作为用户，我想要记录基金的买入和卖出操作，以便系统自动计算我的持仓成本。

#### 验收标准

1. WHEN 用户执行买入操作 THEN Position SHALL 增加相应份额，Cost_Basis SHALL 按加权平均法更新
2. WHEN 用户执行卖出操作 THEN Position SHALL 减少相应份额，系统 SHALL 自动计算并记录实现盈亏
3. WHEN 用户尝试卖出超过持仓的份额 THEN Investment_Account SHALL 拒绝操作并提示错误
4. WHEN 买入或卖出操作完成 THEN Investment_Account SHALL 自动更新当前市值
5. WHEN 用户执行买入操作时指定资金来源账户 THEN 系统 SHALL 从来源账户扣减相应金额

### 需求 3：净值更新

**用户故事：** 作为用户，我想要快速更新基金净值，以便查看最新的资产估值，而不需要每天记录交易。

#### 验收标准

1. WHEN 用户更新净值 THEN Valuation_Record SHALL 记录新的净值和时间戳
2. WHEN 净值更新后 THEN Investment_Account SHALL 自动重新计算当前市值（份额 × 净值）
3. WHEN 净值更新后 THEN Profit_Loss SHALL 自动更新（当前市值 - 成本基础）
4. THE Investment_Account SHALL 保留历史净值记录用于趋势分析

### 需求 4：收益统计

**用户故事：** 作为用户，我想要查看投资收益统计，以便了解我的投资表现。

#### 验收标准

1. WHEN 用户查看投资概览 THEN 系统 SHALL 显示总投入、当前市值、总盈亏和收益率
2. WHEN 用户查看单个投资账户 THEN 系统 SHALL 显示该账户的持仓明细、成本价、当前净值、盈亏金额和盈亏比例
3. WHEN 用户查看收益趋势 THEN 系统 SHALL 基于历史估值记录展示市值变化曲线
4. WHILE 用户在仪表盘页面 THEN 系统 SHALL 在资产统计中包含投资账户的市值

### 需求 5：投资与普通账户的区分

**用户故事：** 作为用户，我想要投资账户与普通账户有清晰的区分，以便分别管理日常收支和投资资产。

#### 验收标准

1. THE Investment_Account SHALL 不参与普通收支交易（不能作为消费支出的账户）
2. WHEN 用户查看账户列表 THEN 系统 SHALL 将投资账户单独分组显示
3. WHEN 用户查看资产统计 THEN 系统 SHALL 分别显示流动资产和投资资产
4. THE Investment_Account 的余额 SHALL 始终等于当前市值（份额 × 最新净值）

### 需求 6：家庭投资汇总

**用户故事：** 作为家庭成员，我想要查看家庭整体的投资情况，以便了解家庭投资资产配置。

#### 验收标准

1. WHEN 用户查看家庭资产 THEN 系统 SHALL 汇总所有成员的投资账户市值
2. WHEN 用户查看家庭投资概览 THEN 系统 SHALL 显示各成员的投资占比
3. WHEN 家庭成员更新自己的投资净值 THEN 家庭投资汇总 SHALL 自动更新
