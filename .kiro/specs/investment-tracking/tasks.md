# 实现计划：投资追踪功能

## 概述

基于设计文档，将投资追踪功能分解为可执行的编码任务。采用后端优先、前端跟进的方式，确保每个任务都能独立验证。

## 任务列表

- [x] 1. 数据库迁移和模型定义

  - [x] 1.1 创建数据库迁移脚本
    - 扩展 accounts 表 type 枚举，新增 'investment'
    - 添加投资账户字段：shares、cost_price、current_net_value
    - 创建 valuations 表
    - _Requirements: 1.1, 3.1, 3.4_
  - [x] 1.2 创建 Valuation 模型
    - 定义 Valuation Sequelize 模型
    - 设置与 Account 的关联关系
    - _Requirements: 3.1_
  - [x] 1.3 扩展 Account 模型
    - 添加投资账户字段定义
    - 添加 isInvestmentAccount() 方法
    - _Requirements: 1.1_

- [x] 2. 后端核心服务实现

  - [x] 2.1 创建投资计算工具函数
    - 实现 calculateNewCostPrice（加权平均成本）
    - 实现 calculateRealizedProfit（卖出盈亏）
    - 实现 calculateMarketValue（市值计算）
    - 实现 calculateProfitRate（收益率计算）
    - _Requirements: 2.1, 2.2, 3.2, 3.3_
  - [x] 2.2 编写计算函数属性测试
    - **Property 2: 加权平均成本计算**
    - **Property 5: 盈亏计算一致性**
    - **Validates: Requirements 2.1, 3.3, 4.1, 4.2**
  - [x] 2.3 创建 InvestmentService
    - 实现 createInvestmentAccount
    - 实现 getInvestmentAccounts
    - 实现 getInvestmentAccountById
    - 实现 updateInvestmentAccount
    - 实现 deleteInvestmentAccount
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.4 编写账户 CRUD 属性测试
    - **Property 9: 级联删除**
    - **Validates: Requirements 1.4**

- [x] 3. 买入/卖出功能实现

  - [x] 3.1 实现买入功能
    - 实现 buyShares 方法
    - 更新份额和成本价
    - 支持资金来源账户扣款
    - _Requirements: 2.1, 2.4, 2.5_
  - [x] 3.2 编写买入功能属性测试
    - **Property 2: 加权平均成本计算**
    - **Property 1: 市值计算不变量**
    - **Property 7: 账户联动一致性**
    - **Validates: Requirements 2.1, 2.4, 2.5**
  - [x] 3.3 实现卖出功能
    - 实现 sellShares 方法
    - 验证卖出份额不超过持仓
    - 计算实现盈亏
    - 支持资金转入目标账户
    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 3.4 编写卖出功能属性测试
    - **Property 3: 卖出份额约束**
    - **Property 4: 卖出盈亏计算**
    - **Property 1: 市值计算不变量**
    - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 4. 净值更新功能实现

  - [x] 4.1 实现净值更新功能
    - 实现 updateNetValue 方法
    - 创建估值记录
    - 更新账户市值
    - 实现批量更新 updateNetValueBatch
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.2 编写净值更新属性测试
    - **Property 1: 市值计算不变量**
    - **Property 6: 估值记录持久化**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 5. 检查点 - 后端核心功能验证

  - 所有测试通过 ✓

- [x] 6. 后端 API 路由和控制器

  - [x] 6.1 创建 InvestmentController
    - 实现账户 CRUD 接口
    - 实现买入/卖出接口
    - 实现净值更新接口
    - _Requirements: 1.1, 2.1, 2.2, 3.1_
  - [x] 6.2 创建投资统计接口
    - 实现 getSummary（投资概览）
    - 实现 getTrend（收益趋势）
    - _Requirements: 4.1, 4.3_
  - [x] 6.3 注册路由
    - 创建 /api/investment 路由
    - 添加认证中间件
    - _Requirements: 1.1_
  - [x] 6.4 编写投资账户隔离属性测试
    - **Property 8: 投资账户隔离**
    - **Validates: Requirements 5.1**

- [x] 7. 前端类型定义和 API 服务

  - [x] 7.1 扩展前端类型定义
    - 添加 InvestmentAccount 类型
    - 添加 ValuationRecord 类型
    - 添加 InvestmentSummary 类型
    - 扩展 AccountType 枚举
    - _Requirements: 1.1, 1.2_
  - [x] 7.2 创建投资 API 服务
    - 实现账户 CRUD API 调用
    - 实现买入/卖出 API 调用
    - 实现净值更新 API 调用
    - 实现统计 API 调用
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 8. 前端投资账户组件

  - [x] 8.1 创建 InvestmentAccountCard 组件
    - 显示产品名称、持仓份额
    - 显示成本价、当前净值
    - 显示市值、盈亏金额和比例
    - 红涨绿跌颜色标识
    - _Requirements: 1.2, 4.2_
  - [x] 8.2 创建 InvestmentForm 组件
    - 买入/卖出操作切换
    - 份额、价格、日期输入
    - 资金账户选择
    - _Requirements: 2.1, 2.2, 2.5_
  - [x] 8.3 创建 NetValueUpdateSheet 组件
    - 快速净值输入
    - 批量更新支持
    - 更新后市值变化预览
    - _Requirements: 3.1, 3.2_

- [x] 9. 前端投资管理页面

  - [x] 9.1 创建 InvestmentManage 页面
    - 投资账户列表展示
    - 投资概览统计卡片
    - 添加/编辑账户功能
    - _Requirements: 1.1, 1.2, 4.1_
  - [x] 9.2 创建投资详情页面
    - 账户详细信息
    - 买入/卖出操作入口
    - 净值更新入口
    - 历史估值记录
    - _Requirements: 4.2, 4.3_
  - [x] 9.3 集成到账户管理页面
    - 在账户列表中分组显示投资账户
    - 添加账户时支持选择投资类型
    - _Requirements: 5.2_

- [x] 10. 检查点 - 前端功能验证

  - 前端组件和页面已创建完成 ✓

- [x] 11. 仪表盘和资产统计集成

  - [x] 11.1 扩展资产统计
    - 在仪表盘显示投资资产
    - 分别显示流动资产和投资资产
    - _Requirements: 4.4, 5.3_
  - [x] 11.2 家庭投资汇总
    - 实现家庭投资统计接口
    - 显示各成员投资占比
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 11.3 编写家庭投资汇总属性测试
    - **Property 10: 家庭投资汇总一致性**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 12. 最终检查点
  - 所有后端测试通过 ✓
  - 前端组件和页面已创建 ✓
  - 路由已配置 ✓
  - 仪表盘已集成投资概览 ✓

## 备注

- 每个任务都引用了具体的需求条款以确保可追溯性
- 检查点用于阶段性验证，确保增量开发的正确性
- 属性测试验证核心计算逻辑的正确性
