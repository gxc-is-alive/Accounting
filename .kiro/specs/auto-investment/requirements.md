# 需求文档

## 简介

定投功能允许用户设置自动化的定期转账计划，系统会按照设定的周期自动从资金账户（如银行卡）转账到目标账户（如基金总账户）。本质上是一个定时转账功能，不涉及份额、净值等投资计算。同时支持单次手动转账，并可记录折扣优惠（如券商优惠券，95 元买 100 元基金）。

## 术语表

- **Auto_Investment_Plan**: 定投计划，定义了定期自动转账的规则
- **Target_Account**: 目标账户，定投转入的账户（如基金总账户）
- **Source_Account**: 资金来源账户，定投扣款的账户（如银行卡）
- **Execution_Record**: 执行记录，记录每次定投的执行情况
- **Discount_Rate**: 折扣率，实际支付金额与获得金额的比例（如 95/100 = 0.95）
- **Scheduler**: 定时调度器，负责触发定投执行

## 需求

### 需求 1：创建定投计划

**用户故事：** 作为用户，我想创建定投计划，以便系统能够自动帮我定期转账到投资账户。

#### 验收标准

1. WHEN 用户创建定投计划 THEN Auto_Investment_Plan SHALL 包含名称、资金来源账户、目标账户、定投金额、执行频率和执行时间
2. WHEN 用户设置执行频率 THEN Auto_Investment_Plan SHALL 支持每日、每周（指定周几）、每月（指定日期）三种频率
3. WHEN 用户指定每月执行日期为 29-31 日 THEN Auto_Investment_Plan SHALL 在当月无该日期时自动调整为月末最后一天
4. WHEN 定投计划创建成功 THEN Auto_Investment_Plan SHALL 默认为启用状态

### 需求 2：管理定投计划

**用户故事：** 作为用户，我想管理我的定投计划，以便根据需要调整或暂停定投。

#### 验收标准

1. WHEN 用户查看定投计划列表 THEN Auto_Investment_Plan SHALL 显示所有计划的名称、金额、频率、状态和下次执行时间
2. WHEN 用户编辑定投计划 THEN Auto_Investment_Plan SHALL 允许修改名称、金额、频率、执行时间和关联账户
3. WHEN 用户暂停定投计划 THEN Auto_Investment_Plan SHALL 将状态设为暂停且不再触发执行
4. WHEN 用户恢复定投计划 THEN Auto_Investment_Plan SHALL 将状态设为启用并重新计算下次执行时间
5. WHEN 用户删除定投计划 THEN Auto_Investment_Plan SHALL 保留历史执行记录但停止后续执行

### 需求 3：定投执行

**用户故事：** 作为用户，我想让系统自动执行定投，以便无需手动操作即可完成转账。

#### 验收标准

1. WHEN 定时器触发且定投计划处于启用状态 THEN Scheduler SHALL 执行该定投计划
2. WHEN 执行定投 THEN Source_Account SHALL 扣减定投金额
3. WHEN 执行定投 THEN Target_Account SHALL 增加相同金额（简单转账，不计算份额）
4. WHEN 资金来源账户余额不足 THEN Execution_Record SHALL 记录执行失败并标注原因
5. WHEN 定投执行完成 THEN Execution_Record SHALL 记录执行时间、转账金额和执行状态
6. WHEN 定投执行成功 THEN Auto_Investment_Plan SHALL 更新下次执行时间

### 需求 4：单次买入转换

**用户故事：** 作为用户，我想进行单次买入转换，以便在有优惠时手动转账并记录折扣。

#### 验收标准

1. WHEN 用户发起单次买入转换 THEN Target_Account SHALL 支持设置实际支付金额和获得的金额
2. WHEN 实际支付金额小于获得的金额 THEN Target_Account SHALL 自动计算折扣率并记录
3. WHEN 单次买入转换执行 THEN Source_Account SHALL 扣减实际支付金额
4. WHEN 单次买入转换执行 THEN Target_Account SHALL 增加获得的金额
5. WHEN 单次买入转换完成 THEN Execution_Record SHALL 记录实际支付金额、获得金额和折扣率

### 需求 5：执行记录查询

**用户故事：** 作为用户，我想查看定投执行记录，以便了解转账历史和执行情况。

#### 验收标准

1. WHEN 用户查看执行记录 THEN Execution_Record SHALL 显示执行时间、定投计划名称、金额和状态
2. WHEN 用户按定投计划筛选 THEN Execution_Record SHALL 只显示该计划的执行记录
3. WHEN 用户按时间范围筛选 THEN Execution_Record SHALL 只显示该时间段内的执行记录
4. WHEN 执行记录包含折扣 THEN Execution_Record SHALL 显示实际支付金额、获得金额和折扣率

### 需求 6：定投提醒

**用户故事：** 作为用户，我想收到定投相关提醒，以便及时了解执行情况和异常。

#### 验收标准

1. WHEN 定投执行失败 THEN Scheduler SHALL 在用户下次登录时显示失败提醒
2. WHEN 资金来源账户余额低于定投金额 THEN Scheduler SHALL 在定投执行前一天显示余额不足预警
3. WHEN 用户查看提醒 THEN Scheduler SHALL 显示提醒类型、相关定投计划和建议操作
