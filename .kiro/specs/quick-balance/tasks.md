# 实现计划：快速平账功能

## 概述

实现快速平账功能，允许用户输入账户实际总额，系统自动计算差额并更新余额。

## 任务

- [x] 1. 数据库迁移

  - [x] 1.1 创建 balance_adjustments 表的迁移脚本
    - 包含 id, user_id, account_id, previous_balance, new_balance, difference, note, created_at 字段
    - _Requirements: 1.6, 2.1_

- [x] 2. 后端模型和服务

  - [x] 2.1 创建 BalanceAdjustment 模型
    - 定义 Sequelize 模型和类型
    - _Requirements: 1.6_
  - [x] 2.2 创建 BalanceAdjustmentService
    - 实现预览差额、执行平账、查询记录方法
    - _Requirements: 1.1, 1.5, 1.6, 2.1, 2.2, 2.3_
  - [x] 2.3 编写属性测试
    - **Property 1: 差额计算正确性**
    - **Property 2: 差额类型判断正确性**
    - **Property 3: 平账后余额一致性**
    - **Property 4: 平账记录完整性**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

- [x] 3. 后端 API

  - [x] 3.1 创建 BalanceAdjustmentController
    - 实现预览、执行平账、查询记录接口
    - _Requirements: 1.1, 1.5, 2.1_
  - [x] 3.2 添加路由配置
    - GET /api/accounts/:id/balance-preview
    - POST /api/accounts/:id/quick-balance
    - GET /api/balance-adjustments
    - _Requirements: 1.1, 1.5, 2.1_

- [x] 4. Checkpoint - 后端完成

  - 确保所有测试通过，如有问题请询问用户

- [x] 5. 前端类型和 API

  - [x] 5.1 添加 TypeScript 类型定义
    - BalancePreview, BalanceAdjustment, BalanceAdjustmentRecord 类型
    - _Requirements: 1.1, 1.6_
  - [x] 5.2 添加 API 调用方法
    - previewBalance, executeQuickBalance, getBalanceAdjustments
    - _Requirements: 1.1, 1.5, 2.1_

- [x] 6. 前端组件

  - [x] 6.1 创建 QuickBalanceForm.vue
    - 显示当前余额、输入实际总额、差额预览、确认按钮
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 6.2 创建 BalanceAdjustmentList.vue
    - 显示平账记录列表，支持筛选
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 6.3 在账户详情页添加"快速平账"入口
    - _Requirements: 3.1, 3.2_

- [x] 7. Final Checkpoint
  - 确保所有功能正常，如有问题请询问用户

## 备注

- 每个任务都引用了具体的需求条款以便追溯
