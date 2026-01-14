# 实现计划：家庭模块完善

## 概述

本计划将家庭模块的完善工作分解为可执行的编码任务。主要工作集中在前端组件的修复和增强，后端 API 已基本完善。

## 任务列表

- [x] 1. 修复 FamilyOverviewCard 组件

  - [x] 1.1 修复数据加载逻辑
    - 检查 loadFamilies 和 loadOverview 方法的错误处理
    - 确保 API 调用正确解析响应数据
    - 添加加载状态和错误状态处理
    - _Requirements: 1.1, 1.3, 1.4_
  - [x] 1.2 修复家庭选择器显示逻辑
    - 当用户加入多个家庭时显示选择器
    - 当用户只加入一个家庭时隐藏选择器
    - _Requirements: 8.1, 8.3_
  - [x] 1.3 编写 FamilyOverviewCard 属性测试
    - **Property 1: 家庭概览显示条件**
    - **Property 9: 家庭选择器显示条件**
    - **Validates: Requirements 1.1, 1.2, 8.1, 8.3**

- [x] 2. 修复 Dashboard 家庭概览集成

  - [x] 2.1 修复 hasFamilies 检查逻辑
    - 确保 checkFamilies 方法正确设置 hasFamilies 状态
    - 处理 API 调用失败的情况
    - _Requirements: 1.1, 1.2_
  - [x] 2.2 修复家庭概览卡片渲染
    - 确保 v-if="hasFamilies" 条件正确工作
    - 添加加载状态显示
    - _Requirements: 1.1, 1.3_

- [x] 3. 检查点 - 确保家庭概览在首页正确显示

  - 运行应用验证 PC 端和移动端首页家庭概览显示
  - 如有问题请询问用户

- [x] 4. 增强 FamilyTransactions 页面

  - [x] 4.1 修复数据加载逻辑
    - 使用 transactionApi.familyList 替代 transactionApi.list
    - 正确处理 FamilyTransaction 类型数据
    - _Requirements: 6.1, 6.2_
  - [x] 4.2 添加成员筛选功能
    - 加载家庭成员列表
    - 添加成员选择器组件
    - 实现按成员筛选交易
    - _Requirements: 6.4_
  - [x] 4.3 添加分类和类型筛选
    - 添加分类选择器
    - 添加收入/支出类型选择器
    - 添加日期范围选择器
    - _Requirements: 6.4_
  - [x] 4.4 优化交易列表展示
    - 显示记录人昵称
    - 显示分类图标和名称
    - 添加空状态提示
    - _Requirements: 6.3, 6.5_
  - [x] 4.5 编写交易筛选属性测试
    - **Property 7: 交易筛选正确性**
    - **Property 8: 分页正确性**
    - **Property 10: 交易记录数据完整性**
    - **Validates: Requirements 6.3, 6.4, 6.6**

- [x] 5. 检查点 - 确保家庭账目页面正确显示

  - 运行应用验证家庭交易列表和筛选功能
  - 如有问题请询问用户

- [x] 6. 创建 FamilyAssetsCard 组件

  - [x] 6.1 创建组件基础结构
    - 创建 FamilyAssetsCard.vue 组件
    - 定义 Props 和 Emits
    - 实现数据加载逻辑
    - _Requirements: 5.1_
  - [x] 6.2 实现资产展示布局
    - 按成员分组展示账户
    - 显示成员余额小计
    - 显示账户类型汇总
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  - [x] 6.3 编写资产计算属性测试
    - **Property 2: 家庭总资产计算正确性**
    - **Property 6: 账户分组正确性**
    - **Validates: Requirements 2.2, 5.4, 5.5**

- [x] 7. 移动端适配优化

  - [x] 7.1 优化 FamilyManage 移动端布局
    - 确保卡片式布局正确显示
    - 确保 BottomSheet 组件正确使用
    - _Requirements: 7.1, 7.4_
  - [x] 7.2 优化 FamilyTransactions 移动端布局
    - 使用卡片式交易列表
    - 添加下拉刷新功能
    - 优化筛选器移动端展示
    - _Requirements: 7.2, 7.3_
  - [x] 7.3 添加移动端加载状态
    - 添加骨架屏加载效果
    - 添加下拉刷新加载状态
    - _Requirements: 7.5_

- [x] 8. 后端属性测试

  - [x] 8.1 编写成员加入时间过滤测试
    - **Property 3: 成员加入时间过滤**
    - **Validates: Requirements 3.2, 6.2**
  - [x] 8.2 编写成员贡献计算测试
    - **Property 4: 成员支出占比总和**
    - **Property 5: 成员贡献排序**
    - **Validates: Requirements 4.3, 4.4**

- [x] 9. 最终检查点 - 确保所有功能正常工作
  - 运行所有测试确保通过
  - 验证 PC 端和移动端家庭模块功能
  - 如有问题请询问用户

## 备注

- 所有任务均为必需任务
- 每个任务都引用了具体的需求编号以便追溯
- 检查点用于确保增量验证
- 属性测试验证核心业务逻辑的正确性
