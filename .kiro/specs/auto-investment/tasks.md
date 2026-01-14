# 实现计划：定投功能

## 概述

实现定投功能，包括定投计划管理、自动执行、单次买入转换（支持折扣）、执行记录查询和提醒功能。

## 任务

- [x] 1. 数据库迁移和模型创建

  - [x] 1.1 创建数据库迁移脚本

    - 创建 auto_investment_plans 表
    - 创建 execution_records 表
    - 创建 investment_reminders 表
    - 添加必要的索引
    - _Requirements: 1.1, 3.5, 6.1_

  - [x] 1.2 创建 Sequelize 模型
    - 创建 AutoInvestmentPlan 模型
    - 创建 ExecutionRecord 模型
    - 创建 InvestmentReminder 模型
    - 在 models/index.ts 中导出
    - _Requirements: 1.1, 3.5, 6.1_

- [x] 2. 定投计划服务实现

  - [x] 2.1 实现 AutoInvestmentPlanService

    - 实现 create 方法（含账户类型验证）
    - 实现 getByUserId 方法
    - 实现 getById 方法
    - 实现 update 方法
    - 实现 pause/resume 方法
    - 实现 delete 方法（软删除）
    - 实现 calculateNextExecutionDate 方法
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 编写属性测试：定投计划数据完整性

    - **Property 1: 定投计划数据完整性**
    - **Validates: Requirements 1.1, 2.1**

  - [x] 2.3 编写属性测试：频率类型支持

    - **Property 2: 频率类型支持**
    - **Validates: Requirements 1.2**

  - [x] 2.4 编写属性测试：月末日期调整

    - **Property 3: 月末日期调整**
    - **Validates: Requirements 1.3**

  - [x] 2.5 编写属性测试：状态管理

    - **Property 4: 状态管理**
    - **Validates: Requirements 1.4, 2.3, 2.4**

  - [x] 2.6 编写属性测试：账户类型验证
    - **Property 5: 账户类型验证**
    - **Validates: Requirements 1.5**

- [x] 3. 执行服务实现

  - [x] 3.1 实现 ExecutionService

    - 实现 executePlan 方法（事务处理）
    - 实现 executeOneTimeBuy 方法（支持折扣）
    - 实现 getRecords 方法（支持筛选）
    - 实现 getRecordsByPlanId 方法
    - 实现份额计算和折扣率计算
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

  - [x] 3.2 编写属性测试：账户余额变化

    - **Property 9: 账户余额变化**
    - **Validates: Requirements 3.2, 4.3**

  - [x] 3.3 编写属性测试：份额计算

    - **Property 10: 份额计算**
    - **Validates: Requirements 3.3, 4.4**

  - [x] 3.4 编写属性测试：余额不足处理

    - **Property 11: 余额不足处理**
    - **Validates: Requirements 3.4**

  - [x] 3.5 编写属性测试：执行记录完整性

    - **Property 12: 执行记录完整性**
    - **Validates: Requirements 3.5, 4.5**

  - [x] 3.6 编写属性测试：折扣率计算
    - **Property 14: 折扣率计算**
    - **Validates: Requirements 4.2**

- [x] 4. 检查点 - 确保所有测试通过

  - 确保所有测试通过，如有问题请询问用户。

- [x] 5. 提醒服务实现

  - [x] 5.1 实现 ReminderService

    - 实现 create 方法
    - 实现 getUnreadByUserId 方法
    - 实现 markAsRead 方法
    - 实现 checkInsufficientBalance 方法
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 5.2 编写属性测试：提醒生成
    - **Property 16: 提醒生成**
    - **Validates: Requirements 6.1, 6.2**

- [x] 6. API 控制器实现

  - [x] 6.1 创建 autoInvestment.controller.ts

    - 实现定投计划 CRUD 端点
    - 实现暂停/恢复端点
    - 实现单次买入转换端点
    - 实现执行记录查询端点
    - 实现提醒管理端点
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 5.1, 6.3_

  - [x] 6.2 创建路由配置
    - 在 routes 目录创建 autoInvestment.routes.ts
    - 在主路由中注册
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.3_

- [x] 7. 前端类型定义

  - [x] 7.1 更新 frontend/src/types/index.ts
    - 添加 AutoInvestmentPlan 类型
    - 添加 ExecutionRecord 类型
    - 添加 InvestmentReminder 类型
    - 添加相关请求/响应类型
    - _Requirements: 1.1, 3.5, 6.1_

- [x] 8. 前端 API 接口

  - [x] 8.1 更新 frontend/src/api/index.ts
    - 添加定投计划 API 方法
    - 添加执行记录 API 方法
    - 添加单次买入转换 API 方法
    - 添加提醒 API 方法
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.3_

- [x] 9. 前端组件实现

  - [x] 9.1 创建定投计划列表组件

    - 创建 frontend/src/components/investment/AutoInvestmentList.vue
    - 显示计划名称、金额、频率、状态、下次执行时间
    - 支持暂停/恢复/删除操作
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 9.2 创建定投计划表单组件

    - 创建 frontend/src/components/investment/AutoInvestmentForm.vue
    - 支持创建和编辑定投计划
    - 频率选择（每日/每周/每月）
    - 账户选择（来源和目标）
    - _Requirements: 1.1, 1.2, 2.2_

  - [x] 9.3 创建单次买入转换组件

    - 创建 frontend/src/components/investment/OneTimeBuyForm.vue
    - 支持设置实际支付金额和获得金额
    - 自动计算并显示折扣率
    - _Requirements: 4.1, 4.2_

  - [x] 9.4 创建执行记录列表组件

    - 创建 frontend/src/components/investment/ExecutionRecordList.vue
    - 显示执行时间、金额、份额、状态
    - 支持按计划和时间筛选
    - 显示折扣信息（如有）
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 9.5 创建提醒组件
    - 创建 frontend/src/components/investment/InvestmentReminder.vue
    - 显示未读提醒
    - 支持标记已读
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 10. 前端页面集成

  - [x] 10.1 更新投资管理页面
    - 在 InvestmentManage.vue 中集成定投功能
    - 添加定投计划 Tab 或区域
    - 添加单次买入转换入口
    - _Requirements: 1.1, 2.1, 4.1_

- [x] 11. 检查点 - 确保所有测试通过

  - 确保所有测试通过，如有问题请询问用户。

- [x] 12. 定时调度器实现

  - [x] 12.1 实现定时任务

    - 创建 backend/src/services/scheduler.service.ts
    - 实现每日定时检查待执行计划
    - 实现余额不足预警检查
    - _Requirements: 3.1, 6.2_

  - [x] 12.2 编写属性测试：调度器触发
    - **Property 8: 调度器触发**
    - **Validates: Requirements 3.1**

## 备注

- 每个任务引用具体需求以便追溯
- 检查点确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
