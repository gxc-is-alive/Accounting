# 实现计划：PC 端退款功能

## 概述

在现有的 TransactionList.vue 桌面端布局中添加退款功能。通过在交易表格的操作列添加"退款"按钮，点击后弹出 el-dialog 对话框，复用 RefundForm 组件完成退款操作。

## 任务

- [x] 1. 在交易表格中添加退款按钮
  - 在 TransactionList.vue 的桌面端 el-table 操作列中添加"退款"按钮
  - 按钮仅对支出类型（expense）的交易显示
  - 使用 v-if 条件渲染：`v-if="row.type === 'expense'"`
  - 按钮样式：`type="warning" link size="small"`
  - 点击按钮调用 `handleRefund(row)` 方法
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 2. 添加退款对话框状态管理
  - 在 TransactionList.vue 的 script setup 中添加退款相关的响应式状态
  - 添加 `refundDialogVisible` (ref<boolean>) - 对话框可见性
  - 添加 `refundTransaction` (ref<Transaction | null>) - 当前退款的交易
  - 添加 `refundFormRef` (ref) - RefundForm 组件引用
  - 添加 `refundSubmitting` (ref<boolean>) - 提交状态
  - 添加 `refundDataLoaded` (computed) - 数据加载状态
  - _Requirements: 2.1, 2.4_

- [x] 3. 实现退款对话框 UI
  - [x] 3.1 在 TransactionList.vue 的桌面端布局中添加 el-dialog 组件
    - 使用 `v-model="refundDialogVisible"` 控制显示
    - 设置 title="申请退款"
    - 设置 width="600px"
    - 设置 `:close-on-click-modal="true"` 和 `:close-on-press-escape="true"`
    - _Requirements: 2.1, 2.2, 2.3, 7.2, 7.3_

  - [x] 3.2 在对话框中嵌入 RefundForm 组件
    - 使用 `v-if="refundTransaction"` 条件渲染
    - 传入 `:transaction="refundTransaction"` prop
    - 绑定 `ref="refundFormRef"`
    - 监听 `@submit="submitRefund"` 事件
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1_

  - [x] 3.3 添加对话框底部按钮
    - 添加"取消"按钮，点击关闭对话框
    - 添加"确认退款"按钮，`:loading="refundSubmitting"`
    - 确认按钮 `:disabled="!refundDataLoaded"`
    - 点击确认按钮调用 `confirmRefund()` 方法
    - _Requirements: 5.1, 5.4_

- [x] 4. 实现退款业务逻辑
  - [x] 4.1 实现 handleRefund 方法
    - 接收 transaction 参数
    - 设置 `refundTransaction.value = transaction`
    - 设置 `refundDialogVisible.value = true`
    - _Requirements: 1.5, 2.1_

  - [x] 4.2 实现 submitRefund 方法
    - 接收 `data: CreateRefundParams` 参数
    - 设置 `refundSubmitting.value = true`
    - 调用 `refundApi.create(data)`
    - 成功时：显示成功消息、关闭对话框、清空 refundTransaction、刷新交易列表
    - 失败时：显示错误消息（优先使用后端返回的错误）、保持对话框打开
    - finally 块中设置 `refundSubmitting.value = false`
    - _Requirements: 5.2, 5.3, 5.5, 5.6_

  - [x] 4.3 实现 confirmRefund 方法
    - 检查 `refundFormRef.value` 是否存在
    - 调用 `refundFormRef.value.submit()` 触发表单提交
    - _Requirements: 5.1_

- [x] 5. 导入必要的依赖
  - 从 `@/components/refund` 导入 RefundForm 组件
  - 从 `@/api` 导入 refundApi
  - 从 `@/types` 导入 CreateRefundParams 类型
  - 确保已导入 ElMessage（用于显示提示消息）
  - _Requirements: 6.1, 6.4_

- [x] 6. 调整表格操作列宽度
  - 将操作列的 width 从 "120" 调整为 "180"
  - 确保三个按钮（编辑、删除、退款）能够正常显示
  - _Requirements: 1.1_

- [x] 7. 编写单元测试
  - [x] 7.1 测试退款按钮显示逻辑
    - 测试支出交易显示退款按钮
    - 测试收入、还款、退款类型不显示退款按钮
    - _Requirements: 1.2, 1.3_

  - [x] 7.2 测试对话框交互
    - 测试点击退款按钮打开对话框
    - 测试点击取消按钮关闭对话框
    - _Requirements: 1.5, 2.1_

  - [x] 7.3 测试退款提交流程
    - 测试成功提交后的状态变化
    - 测试失败提交后的错误处理
    - _Requirements: 5.5, 5.6_

- [x] 8. 编写属性测试
  - [x] 8.1 编写 Property 1 测试：退款按钮显示规则
    - **Property 1: 退款按钮显示规则**
    - **Validates: Requirements 1.2, 1.3, 1.4**
    - 使用 fast-check 生成随机交易数据
    - 验证按钮显示逻辑符合规则

  - [x] 8.2 编写 Property 6 测试：退款金额验证规则
    - **Property 6: 退款金额验证规则**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
    - 使用 fast-check 生成随机金额
    - 验证验证逻辑正确

  - [x] 8.3 编写 Property 8 测试：退款提交反馈
    - **Property 8: 退款提交反馈**
    - **Validates: Requirements 5.5, 5.6**
    - 模拟成功和失败场景
    - 验证反馈行为正确

- [x] 9. 检查点 - 确保所有功能正常
  - 在浏览器中测试完整的退款流程
  - 验证退款按钮正确显示
  - 验证对话框正常打开和关闭
  - 验证退款提交成功和失败的反馈
  - 验证交易列表刷新
  - 如有问题，询问用户

- [x] 10. 编写 E2E 测试
  - [x] 10.1 使用 Playwright 编写完整退款流程测试
    - 打开交易列表页面
    - 点击退款按钮
    - 填写退款信息
    - 提交退款
    - 验证成功消息和列表刷新
    - _Requirements: 1.1, 1.5, 2.1, 5.5_

## 注意事项

- 每个任务都引用了具体的需求编号，便于追溯
- 复用现有的 RefundForm 组件，保持代码一致性
- 使用 Element Plus 的设计风格，与现有桌面端页面保持一致
- 错误处理要优先显示后端返回的错误消息
- 所有测试任务都是必需的，确保全面的测试覆盖
