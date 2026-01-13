# 实现计划：家庭账单优化

## 概述

本计划将家庭账单优化功能分解为可执行的编码任务，主要涉及后端统计服务的重构和前端家庭概览页面的实现。

## 任务列表

- [ ] 1. 重构家庭统计服务

  - [x] 1.1 实现基于成员加入时间的交易查询逻辑

    - 修改 `statistics.service.ts`，添加 `getFamilyMemberTransactions` 方法
    - 查询条件：成员的交易日期 >= 成员加入时间
    - 支持日期范围、成员、分类、账单类型筛选
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4_

  - [x] 1.2 实现家庭总存款计算

    - 添加 `getFamilyTotalAssets` 方法
    - 汇总所有成员的账户余额
    - 按账户类型分组统计
    - 按成员分组统计
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.3 实现家庭概览统计

    - 添加 `getFamilyOverview` 方法
    - 返回家庭总收入、总支出、结余、总存款
    - 返回各成员的收支贡献和占比
    - _Requirements: 1.2, 1.3, 4.1, 4.2, 4.3_

  - [x] 1.4 编写家庭收支汇总属性测试

    - **Property 1: 家庭收支汇总正确性**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [x] 1.5 编写家庭总存款属性测试

    - **Property 2: 家庭总存款计算正确性**
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [x] 1.6 编写成员贡献占比属性测试
    - **Property 4: 成员贡献占比总和**
    - **Validates: Requirements 4.2, 4.3**

- [ ] 2. 实现家庭年度报表

  - [x] 2.1 实现家庭年度统计方法

    - 添加 `getFamilyYearlyStats` 方法
    - 返回年度总收入、总支出、结余
    - 返回 12 个月的收支趋势
    - 返回各分类的支出占比
    - 返回各成员的年度贡献
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.2 编写年度报表属性测试
    - **Property 5: 年度报表月度数据一致性**
    - **Property 6: 分类占比总和**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 3. 实现家庭统计 API

  - [x] 3.1 添加家庭统计路由和控制器

    - 创建 `GET /api/statistics/family/:familyId/overview` 接口
    - 创建 `GET /api/statistics/family/:familyId/assets` 接口
    - 创建 `GET /api/statistics/family/:familyId/yearly` 接口
    - 添加权限验证中间件
    - _Requirements: 1.1, 2.1, 3.1, 7.1, 7.4_

  - [x] 3.2 实现家庭账单列表 API

    - 创建 `GET /api/transactions/family/:familyId` 接口
    - 支持按成员、日期、分类、账单类型筛选
    - 添加分页支持
    - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4_

  - [x] 3.3 编写权限控制属性测试
    - **Property 9: 非成员访问拒绝**
    - **Property 7: 成员退出后不纳入统计**
    - **Property 8: 新成员加入时间边界**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 4. 检查点 - 确保后端测试通过

  - 运行所有测试，确保通过
  - 如有问题请询问用户

- [x] 5. 实现成员加入/退出统计边界

  - [x] 5.1 实现成员退出后的统计排除逻辑

    - 确保已退出成员的交易不纳入统计
    - 修改查询逻辑，只查询当前成员
    - 注：当前实现中，成员退出时直接删除记录，自然不会被统计
    - _Requirements: 7.2_

  - [x] 5.2 验证成员加入时间边界逻辑

    - 确保只统计成员加入后的交易
    - 添加边界条件测试
    - 注：已在 getFamilyMemberTransactions 和 calculateFamilyIncomeExpense 中实现
    - _Requirements: 7.3_

  - [x] 5.3 编写成员边界属性测试
    - **Property 7: 成员退出后不纳入统计**
    - **Property 8: 新成员加入时间边界**
    - 注：已在任务 3.3 中完成
    - **Validates: Requirements 7.2, 7.3**

- [ ] 6. 前端家庭概览组件

  - [x] 6.1 创建家庭概览 API 调用

    - 在 `api/index.ts` 添加家庭统计相关 API
    - 添加类型定义
    - _Requirements: 全局_

  - [x] 6.2 实现家庭概览卡片组件

    - 创建 `FamilyOverviewCard.vue` 组件
    - 显示家庭本月收支、结余、总存款
    - 显示各成员贡献占比
    - 支持移动端响应式布局
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 6.3 实现家庭切换功能
    - 在概览组件中添加家庭选择器
    - 支持多家庭切换
    - _Requirements: 6.4_

- [ ] 7. 前端家庭报表页面（可选，后续迭代）

  - [ ] 7.1 优化家庭账单列表页面

    - 修改 `FamilyTransactions.vue`
    - 添加成员筛选功能
    - 显示记录人信息
    - _Requirements: 5.1, 7.2_

  - [ ] 7.2 实现家庭年度报表页面

    - 创建 `FamilyYearlyReport.vue` 页面
    - 显示年度收支趋势图表
    - 显示分类占比饼图
    - 显示成员贡献明细
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 7.3 实现家庭资产明细页面
    - 创建 `FamilyAssets.vue` 页面
    - 显示家庭总存款
    - 按账户类型分组显示
    - 按成员分组显示
    - _Requirements: 2.1, 2.2, 2.4_

- [x] 8. 集成到仪表盘

  - [x] 8.1 在仪表盘添加家庭概览模块

    - 修改 `DashboardView.vue`
    - 添加家庭概览卡片
    - 支持展开查看详情
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 8.2 添加家庭报表入口（可选，后续迭代）
    - 在侧边栏或导航中添加家庭报表入口
    - 配置路由
    - _Requirements: 全局_

- [x] 9. 最终检查点 - 确保所有测试通过
  - 运行所有后端测试 ✓ (91 passed)
  - 前端测试（可选，后续迭代）
  - 如有问题请询问用户

## 备注

- 所有任务均为必需任务
- 每个任务都引用了具体的需求编号以便追溯
- 检查点用于确保增量验证
- 属性测试验证核心业务逻辑的正确性
