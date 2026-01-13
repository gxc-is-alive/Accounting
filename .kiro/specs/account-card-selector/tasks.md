# 实现计划：账户卡片选择器

## 概述

将新增账单页面的账户选择从下拉框改为卡片网格形式，实现智能排序功能，优先展示最常用和最近使用的账户。

## 任务

- [x] 1. 扩展账户类型图标映射

  - [x] 1.1 在 `frontend/src/utils/iconMap.ts` 中添加账户类型图标映射
    - 定义 `accountTypeIconMap` 对象，为每种账户类型（cash、bank、alipay、wechat、credit、investment、other）提供默认图标
    - 实现 `getAccountIcon(account: Account): string` 函数
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 1.2 编写账户图标映射的属性测试
    - **Property 6: 图标选择优先级**
    - **Property 7: 账户类型图标完备性**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 2. 实现账户使用记录追踪

  - [x] 2.1 创建 `frontend/src/composables/useAccountUsage.ts`
    - 定义 `AccountUsageRecord` 和 `AccountUsageStorage` 接口
    - 实现 `recordUsage(accountId: number)` 函数
    - 实现 `getUsageRecord(accountId: number)` 函数
    - 实现 localStorage 读写逻辑，包含错误处理
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.2 编写使用记录追踪的属性测试
    - **Property 2: 使用次数递增不变量**
    - **Property 3: 使用记录持久化往返**
    - **Validates: Requirements 2.1, 2.3, 2.4**

- [x] 3. 实现智能排序算法

  - [x] 3.1 在 `useAccountUsage.ts` 中实现排序逻辑
    - 实现 `calculateScore(record: AccountUsageRecord)` 函数
    - 实现 `getSortedAccounts(accounts: Account[])` 函数
    - 处理未使用账户的排序（排在已使用账户之后）
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 3.2 编写智能排序的属性测试
    - **Property 4: 智能排序降序性**
    - **Property 5: 评分权重正确性**
    - **Validates: Requirements 3.1, 3.2, 3.4**

- [x] 4. 检查点 - 确保所有测试通过

  - 确保所有测试通过，如有问题请询问用户

- [x] 5. 创建账户卡片选择器组件

  - [x] 5.1 创建 `frontend/src/components/account/AccountCardSelector.vue`
    - 实现卡片网格布局（桌面端 5 列，移动端 4 列）
    - 实现账户卡片渲染（显示图标和名称）
    - 实现选中状态样式（与分类选择器一致）
    - 实现 v-model 双向绑定
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 5.2 编写账户卡片渲染的属性测试
    - **Property 1: 账户卡片渲染完整性**
    - **Validates: Requirements 1.2**

- [x] 6. 集成到快速记账页面

  - [x] 6.1 修改 `frontend/src/views/transaction/QuickAdd.vue`
    - 引入 AccountCardSelector 组件替换 el-select
    - 集成 useAccountUsage composable
    - 实现智能排序的账户列表
    - 实现默认选中排序后的第一个账户
    - 在交易提交成功后调用 recordUsage
    - _Requirements: 3.5, 4.1, 4.2, 4.3_

- [x] 7. 最终检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

## 备注

- 每个任务都引用了具体的需求以便追溯
- 检查点确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
