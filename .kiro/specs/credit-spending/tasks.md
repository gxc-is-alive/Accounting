# 实现计划：提前支出功能

## 概述

本计划将提前支出功能分解为可增量实现的任务，从数据模型扩展开始，逐步实现服务层、API 和前端组件。

## 任务

- [x] 1. 扩展数据模型

  - [x] 1.1 扩展 Account 模型支持信用账户字段

    - 在 `backend/src/models/Account.ts` 添加 creditLimit、billingDay、dueDay 字段
    - 更新 AccountAttributes 和 AccountCreationAttributes 接口
    - 添加 isCreditAccount() 辅助方法
    - _需求: 1.1, 1.2_

  - [x] 1.2 扩展 Transaction 模型支持还款类型

    - 在 `backend/src/models/Transaction.ts` 添加 'repayment' 交易类型
    - 添加 sourceAccountId 字段用于还款交易
    - 更新 TransactionType 类型定义
    - _需求: 3.6_

  - [x] 1.3 创建数据库迁移脚本

    - 创建 SQL 迁移脚本扩展 accounts 和 transactions 表
    - _需求: 7.1_

  - [x] 1.4 编写数据模型属性测试
    - **Property 6: 数据序列化往返一致性**
    - **验证: 需求 7.3**

- [x] 2. 实现信用计算服务

  - [x] 2.1 创建 CreditService

    - 创建 `backend/src/services/credit.service.ts`
    - 实现 calculateOutstandingBalance() 计算待还金额
    - 实现 calculateAvailableCredit() 计算可用额度
    - _需求: 4.1, 4.2, 4.4_

  - [x] 2.2 编写可用额度计算属性测试

    - **Property 1: 可用额度计算一致性**
    - **验证: 需求 4.1, 4.2**

  - [x] 2.3 编写待还金额非负性属性测试
    - **Property 4: 待还金额非负性**
    - **验证: 需求 4.4**

- [x] 3. 检查点 - 确保所有测试通过

  - 确保所有测试通过，如有问题请询问用户

- [x] 4. 实现还款服务

  - [x] 4.1 创建 RepaymentService

    - 创建 `backend/src/services/repayment.service.ts`
    - 实现 createRepayment() 还款操作
    - 实现余额验证和事务处理
    - _需求: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 4.2 编写还款金额守恒属性测试

    - **Property 2: 还款金额守恒**
    - **验证: 需求 3.3, 3.4, 3.5**

  - [x] 4.3 编写还款来源余额充足性属性测试
    - **Property 5: 还款来源余额充足性**
    - **验证: 需求 3.2, 3.8**

- [x] 5. 实现信用消费逻辑

  - [x] 5.1 扩展 TransactionService 支持信用消费

    - 修改 `backend/src/services/transaction.service.ts`
    - 在创建支出交易时检查是否为信用账户
    - 信用账户支出不扣减余额，而是增加待还金额
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 编写消费金额守恒属性测试
    - **Property 3: 消费金额守恒**
    - **验证: 需求 2.1, 2.2**

- [x] 6. 检查点 - 确保所有测试通过

  - 确保所有测试通过，如有问题请询问用户

- [x] 7. 实现还款提醒服务

  - [x] 7.1 扩展 CreditService 添加提醒功能

    - 实现 getDueReminders() 获取即将到期的还款
    - 实现 isOverdue() 判断是否逾期
    - _需求: 5.1, 5.2, 5.3, 5.4_

  - [x] 7.2 编写还款提醒准确性属性测试
    - **Property 7: 还款提醒准确性**
    - **验证: 需求 5.1, 5.2**

- [x] 8. 实现 API 端点

  - [x] 8.1 扩展账户 API 支持信用账户

    - 修改 `backend/src/controllers/account.controller.ts`
    - 添加 GET /api/accounts/:id/credit 端点
    - 更新创建/编辑账户支持信用字段
    - _需求: 1.1, 1.2, 1.3, 1.4, 4.3_

  - [x] 8.2 创建还款 API

    - 创建 `backend/src/controllers/repayment.controller.ts`
    - 实现 POST /api/repayments 创建还款
    - 实现 GET /api/repayments 获取还款历史
    - 创建 `backend/src/routes/repayment.routes.ts`
    - _需求: 3.1_

  - [x] 8.3 创建提醒 API
    - 实现 GET /api/credit/reminders 获取还款提醒
    - _需求: 5.1, 5.2, 5.3_

- [x] 9. 检查点 - 确保所有测试通过

  - 确保所有测试通过，如有问题请询问用户

- [x] 10. 更新前端类型定义

  - [x] 10.1 扩展前端类型
    - 修改 `frontend/src/types/index.ts`
    - 添加 CreditAccountFields 接口
    - 扩展 Account 类型支持信用字段
    - 添加 RepaymentTransaction 类型
    - 添加 DueReminder 类型
    - _需求: 1.4, 4.3_

- [x] 11. 实现前端 API 调用

  - [x] 11.1 扩展账户 API
    - 修改 `frontend/src/api/index.ts`
    - 添加获取信用账户详情 API
    - 添加还款 API
    - 添加获取还款提醒 API
    - _需求: 3.1, 5.1_

- [x] 12. 实现前端组件

  - [x] 12.1 创建信用账户卡片组件

    - 创建 `frontend/src/components/credit/CreditAccountCard.vue`
    - 显示信用额度、可用额度、待还金额
    - 显示账单日和还款日
    - _需求: 1.4, 4.3_

  - [x] 12.2 创建还款表单组件

    - 创建 `frontend/src/components/credit/RepaymentForm.vue`
    - 选择信用账户和来源账户
    - 输入还款金额，支持全额还款
    - _需求: 3.1, 3.2_

  - [x] 12.3 创建还款提醒组件
    - 创建 `frontend/src/components/credit/RepaymentReminder.vue`
    - 显示即将到期和逾期的还款
    - _需求: 5.1, 5.2, 5.3_

- [x] 13. 集成到现有页面

  - [x] 13.1 更新账户管理页面

    - 修改 `frontend/src/views/settings/AccountManage.vue`
    - 创建信用账户时显示额外字段
    - 在账户列表中使用 CreditAccountCard
    - _需求: 1.1, 1.3, 1.4, 1.5_

  - [x] 13.2 更新仪表盘页面

    - 修改 `frontend/src/views/dashboard/DashboardView.vue`
    - 添加还款提醒组件
    - _需求: 5.1, 5.2, 5.3_

  - [x] 13.3 创建还款页面
    - 创建 `frontend/src/views/credit/RepaymentView.vue`
    - 集成还款表单和还款历史
    - 添加路由配置
    - _需求: 3.1_

- [x] 14. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

## 备注

- 所有任务都必须完成，包括属性测试
- 每个任务都引用了具体的需求以便追溯
- 检查点用于确保增量验证
- 属性测试验证核心业务逻辑的正确性
