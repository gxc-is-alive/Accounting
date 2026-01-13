# 需求文档：家庭账单优化

## 简介

优化家庭账单逻辑，将家庭成员的所有个人账单自动汇总为家庭账单。作为一个家庭，虽然日常可能分开记账，但需要在年底或任意时间点查看家庭整体的收支情况和总存款。核心理念是：**家庭成员的账就是家庭账**。

## 术语表

- **Family（家庭）**: 由多个用户组成的群组
- **Family_Member（家庭成员）**: 家庭中的用户
- **Family_Statistics_Service（家庭统计服务）**: 负责汇总家庭成员账单的服务
- **Family_Balance（家庭余额）**: 所有家庭成员账户余额的总和
- **Member_Contribution（成员贡献）**: 单个成员对家庭收支的贡献明细
- **Transaction（交易记录）**: 一笔收入或支出的记录
- **Account（账户）**: 用户的资金账户

## 需求

### 需求 1：家庭账单自动汇总

**用户故事：** 作为一个家庭成员，我希望家庭账单能自动汇总所有成员的个人账单，以便无需手动标记即可查看家庭整体财务状况。

#### 验收标准

1. WHEN 家庭成员查看家庭账单 THEN Family_Statistics_Service SHALL 返回该家庭所有成员的所有交易记录
2. WHEN 计算家庭收入 THEN Family_Statistics_Service SHALL 汇总所有成员的收入交易
3. WHEN 计算家庭支出 THEN Family_Statistics_Service SHALL 汇总所有成员的支出交易
4. WHEN 家庭成员创建个人交易记录 THEN Transaction_Service SHALL 自动将其纳入家庭账单统计范围

### 需求 2：家庭总存款查看

**用户故事：** 作为一个家庭成员，我希望能查看家庭的总存款，以便了解家庭整体的资产状况。

#### 验收标准

1. WHEN 家庭成员查看家庭总存款 THEN Family_Statistics_Service SHALL 返回所有成员账户余额的总和
2. WHEN 计算家庭总存款 THEN Family_Statistics_Service SHALL 分别统计各类账户（现金、银行卡、支付宝等）的余额
3. WHEN 成员账户余额变化 THEN Family_Statistics_Service SHALL 实时反映在家庭总存款中
4. WHEN 查看家庭资产明细 THEN Family_Statistics_Service SHALL 返回各成员的账户余额列表

### 需求 3：家庭年度报表

**用户故事：** 作为一个家庭成员，我希望能查看家庭的年度收支报表，以便在年底总结家庭财务状况。

#### 验收标准

1. WHEN 家庭成员查看年度报表 THEN Family_Statistics_Service SHALL 返回该年度家庭总收入、总支出和结余
2. WHEN 生成年度报表 THEN Family_Statistics_Service SHALL 按月份展示收支趋势
3. WHEN 查看年度分类统计 THEN Family_Statistics_Service SHALL 返回各分类的家庭支出占比
4. WHEN 查看年度成员贡献 THEN Family_Statistics_Service SHALL 返回各成员的年度收支明细

### 需求 4：成员贡献统计

**用户故事：** 作为一个家庭成员，我希望能查看各成员对家庭财务的贡献，以便了解家庭收支的来源分布。

#### 验收标准

1. WHEN 查看成员贡献 THEN Family_Statistics_Service SHALL 返回各成员的收入和支出金额
2. WHEN 计算成员贡献占比 THEN Family_Statistics_Service SHALL 返回各成员收入占家庭总收入的百分比
3. WHEN 计算成员支出占比 THEN Family_Statistics_Service SHALL 返回各成员支出占家庭总支出的百分比
4. WHEN 查看成员贡献趋势 THEN Family_Statistics_Service SHALL 返回各成员按月的收支变化

### 需求 5：家庭账单筛选

**用户故事：** 作为一个家庭成员，我希望能按条件筛选家庭账单，以便快速找到特定的交易记录。

#### 验收标准

1. WHEN 按成员筛选家庭账单 THEN Family_Statistics_Service SHALL 返回指定成员的交易记录
2. WHEN 按日期范围筛选 THEN Family_Statistics_Service SHALL 返回该范围内所有成员的交易记录
3. WHEN 按分类筛选 THEN Family_Statistics_Service SHALL 返回该分类下所有成员的交易记录
4. WHEN 按账单类型筛选 THEN Family_Statistics_Service SHALL 返回该类型下所有成员的交易记录

### 需求 6：家庭财务概览

**用户故事：** 作为一个家庭成员，我希望在首页能快速查看家庭财务概览，以便随时了解家庭财务状态。

#### 验收标准

1. WHEN 家庭成员访问首页 THEN UI SHALL 显示家庭本月收支概览
2. WHEN 显示家庭概览 THEN UI SHALL 展示家庭总存款
3. WHEN 显示家庭概览 THEN UI SHALL 展示本月各成员的收支贡献
4. WHEN 家庭有多个 THEN UI SHALL 允许切换查看不同家庭的概览

### 需求 7：数据权限控制

**用户故事：** 作为一个家庭成员，我希望只有家庭成员才能查看家庭账单，以保护家庭财务隐私。

#### 验收标准

1. WHEN 非家庭成员尝试访问家庭账单 THEN Family_Statistics_Service SHALL 拒绝访问并返回 403 错误
2. WHEN 家庭成员退出家庭 THEN Family_Statistics_Service SHALL 不再将其账单纳入该家庭统计
3. WHEN 新成员加入家庭 THEN Family_Statistics_Service SHALL 从加入时刻起将其账单纳入家庭统计
4. WHEN 查看家庭账单 THEN Auth_Service SHALL 验证请求者是否为家庭成员
