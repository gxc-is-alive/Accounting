# 实现计划：退款功能

## 概述

本计划将退款功能分解为数据库迁移、后端服务、API 接口和前端组件四个主要部分，按顺序实现并确保每个步骤都有对应的测试覆盖。

## 任务

- [x] 1. 数据库迁移和模型扩展

  - [x] 1.1 创建数据库迁移脚本
    - 添加 `original_transaction_id` 字段到 transactions 表
    - 添加外键约束，设置级联删除
    - 扩展 type 枚举，添加 `refund` 类型
    - _Requirements: 1.1, 3.1, 3.4_
  - [x] 1.2 更新 Transaction 模型
    - 添加 `originalTransactionId` 属性
    - 更新 `TransactionType` 类型定义
    - 添加与原交易的关联关系
    - _Requirements: 1.1, 3.1_
  - [x] 1.3 编写属性测试：退款级联删除
    - **Property 6: 退款级联删除**
    - **Validates: Requirements 3.4**

- [x] 2. 退款服务核心逻辑

  - [x] 2.1 创建 RefundService 服务
    - 实现 `calculateRefundableAmount` 方法
    - 实现 `getRefundInfo` 方法
    - _Requirements: 2.1, 3.2, 3.3_
  - [x] 2.2 编写属性测试：可退款金额计算
    - **Property 5: 可退款金额计算**
    - **Validates: Requirements 2.1, 3.2, 3.3**
  - [x] 2.3 实现创建退款逻辑
    - 验证原交易存在且为支出类型
    - 验证退款金额合法性
    - 创建退款交易记录
    - 更新账户余额（区分信用/非信用账户）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 2.4_
  - [x] 2.4 编写属性测试：退款金额验证
    - **Property 2: 退款金额验证**
    - **Validates: Requirements 1.2, 1.3, 2.2, 2.3, 2.4**
  - [x] 2.5 编写属性测试：退款创建关联性
    - **Property 1: 退款创建关联性**
    - **Validates: Requirements 1.1, 3.1**
  - [x] 2.6 编写属性测试：非信用账户退款余额更新
    - **Property 3: 非信用账户退款余额更新**
    - **Validates: Requirements 1.4, 1.5**
  - [x] 2.7 编写属性测试：信用账户退款待还金额更新
    - **Property 4: 信用账户退款待还金额更新**
    - **Validates: Requirements 1.6**

- [x] 3. 退款删除和编辑逻辑

  - [x] 3.1 实现删除退款逻辑
    - 恢复账户余额
    - 删除退款记录
    - _Requirements: 5.3, 5.4_
  - [x] 3.2 编写属性测试：删除退款恢复
    - **Property 8: 删除退款恢复**
    - **Validates: Requirements 5.3, 5.4**
  - [x] 3.3 实现编辑退款逻辑
    - 重新验证金额合法性
    - 调整账户余额差额
    - _Requirements: 5.2_

- [x] 4. 检查点 - 确保所有后端测试通过

  - 运行所有属性测试和单元测试
  - 如有问题请询问用户

- [ ] 5. 统计服务扩展

  - [x] 5.1 更新统计服务支持退款
    - 修改月度统计计算，扣除退款金额
    - 修改分类统计计算，扣除对应分类退款
    - 返回总支出、总退款、净支出
    - _Requirements: 4.1, 4.2, 4.4_
  - [x] 5.2 编写属性测试：退款统计计算
    - **Property 7: 退款统计计算**
    - **Validates: Requirements 4.1, 4.2, 4.4**

- [x] 6. API 路由和控制器

  - [x] 6.1 创建退款控制器
    - 实现 `createRefund` 接口
    - 实现 `getTransactionRefunds` 接口
    - 实现 `deleteRefund` 接口
    - _Requirements: 1.1, 3.2, 5.3_
  - [x] 6.2 添加退款路由
    - POST /api/refunds - 创建退款
    - GET /api/transactions/:id/refunds - 获取交易退款信息
    - DELETE /api/refunds/:id - 删除退款
    - _Requirements: 1.1, 3.2, 5.3_
  - [x] 6.3 更新交易列表接口支持退款筛选
    - 支持 type=refund 筛选
    - 返回退款交易的原交易信息
    - _Requirements: 5.1, 6.4_
  - [x] 6.4 编写属性测试：退款类型筛选
    - **Property 9: 退款类型筛选**
    - **Validates: Requirements 6.4**

- [x] 7. 检查点 - 确保所有后端功能完成

  - 运行所有测试
  - 如有问题请询问用户

- [x] 8. 前端类型定义

  - [x] 8.1 更新前端类型定义
    - 添加 `refund` 到 TransactionType
    - 添加 `originalTransactionId` 到 Transaction
    - 添加退款相关接口类型
    - _Requirements: 1.1, 3.1_

- [x] 9. 前端 API 接口

  - [x] 9.1 添加退款 API 方法
    - 实现 `createRefund` 方法
    - 实现 `getTransactionRefunds` 方法
    - 实现 `deleteRefund` 方法
    - _Requirements: 1.1, 3.2, 5.3_

- [x] 10. 前端退款组件

  - [x] 10.1 创建 RefundForm 组件
    - 显示原交易信息
    - 显示可退款金额
    - 退款金额输入和验证
    - _Requirements: 6.2, 6.3_
  - [x] 10.2 创建 RefundButton 组件
    - 根据可退款金额显示/隐藏
    - 点击打开退款表单
    - _Requirements: 6.1_
  - [x] 10.3 更新交易详情页
    - 集成退款按钮
    - 显示退款历史
    - _Requirements: 5.1, 6.1_
  - [x] 10.4 更新交易列表
    - 退款交易特殊标识
    - 支持退款类型筛选
    - _Requirements: 4.3, 6.4, 6.5_

- [x] 11. 最终检查点 - 确保所有功能完成
  - 运行所有测试 ✅ (335 tests passed)
  - 如有问题请询问用户

## 备注

- 每个任务都引用了具体的需求条款以确保可追溯性
- 检查点用于确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边界条件
