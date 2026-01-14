# Implementation Plan: 移动端账户管理页面

## Overview

本实现计划将移动端账户管理从弹窗交互改为独立页面交互。主要工作包括：创建新的表单页面组件、添加路由配置、修改现有账户列表页面的交互逻辑。

## Tasks

- [x] 1. 创建移动端账户表单页面

  - [x] 1.1 创建 `AccountForm.vue` 页面组件

    - 创建 `frontend/src/views/settings/AccountForm.vue`
    - 实现表单布局：页面标题、返回按钮、表单字段
    - 实现账户类型选择和信用账户额外字段的条件显示
    - 实现添加模式和编辑模式的区分逻辑
    - _Requirements: 1.4, 1.5, 2.4, 5.1_

  - [x] 1.2 实现表单数据加载和预填充

    - 根据路由参数判断添加/编辑模式
    - 编辑模式下从 accountStore 加载账户数据
    - 预填充表单字段
    - _Requirements: 2.3_

  - [x] 1.3 实现表单提交逻辑

    - 实现表单验证
    - 添加模式调用 `accountStore.createAccount`
    - 编辑模式调用 `accountStore.updateAccount`
    - 提交成功后返回账户列表页
    - _Requirements: 1.2, 2.2_

  - [x] 1.4 实现删除功能

    - 编辑模式下显示删除按钮
    - 点击删除显示确认对话框
    - 确认后调用 `accountStore.deleteAccount` 并返回列表页
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 1.5 编写信用账户字段显示属性测试

    - **Property 4: 信用账户字段显示属性**
    - **Validates: Requirements 1.5, 2.4**

  - [x] 1.6 编写表单预填充属性测试

    - **Property 5: 表单预填充属性**
    - **Validates: Requirements 2.3**

  - [x] 1.7 编写删除按钮显示属性测试
    - **Property 6: 删除按钮显示属性**
    - **Validates: Requirements 3.1**

- [x] 2. 配置路由

  - [x] 2.1 添加账户表单页面路由
    - 在 `frontend/src/router/index.ts` 添加新路由
    - 路由路径: `settings/accounts/form/:id?`
    - 支持可选的账户 ID 参数
    - _Requirements: 1.1, 2.1_

- [x] 3. 修改账户列表页面

  - [x] 3.1 修改 `AccountManage.vue` 的交互逻辑

    - 添加按钮点击：移动端导航到表单页，桌面端显示弹窗
    - 账户点击：移动端导航到编辑页，桌面端显示详情/编辑弹窗
    - 移除移动端的 BottomSheet 表单弹窗（保留详情弹窗可选）
    - _Requirements: 1.1, 2.1, 4.1, 4.2_

  - [x] 3.2 编写移动端导航属性测试

    - **Property 1: 移动端导航属性**
    - **Validates: Requirements 1.1, 2.1, 4.2**

  - [x] 3.3 编写桌面端弹窗属性测试
    - **Property 2: 桌面端弹窗属性**
    - **Validates: Requirements 4.1**

- [x] 4. Checkpoint - 确保所有测试通过
  - 运行所有测试确保功能正常
  - 如有问题请询问用户

## Notes

- 每个任务都引用了具体的需求条款以便追溯
- 属性测试验证通用正确性属性
- 设备检测断点属性（Property 3）已在现有 `useDevice.ts` 中实现并测试，无需重复
