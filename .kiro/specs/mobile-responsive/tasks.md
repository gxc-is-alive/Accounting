# 实现计划：移动端响应式适配

## 概述

本计划将家庭记账系统从纯 PC 端适配为响应式多端应用，采用渐进式实现策略，优先完成核心布局和导航，再逐步适配各功能页面。

## 任务列表

- [x] 1. 搭建响应式基础架构

  - [x] 1.1 创建 CSS 变量和响应式 mixins

    - 创建 `frontend/src/styles/variables.scss` 定义断点变量
    - 创建 `frontend/src/styles/responsive.scss` 定义媒体查询 mixins
    - 在 `main.ts` 中引入全局样式
    - _Requirements: 1.1, 1.5_

  - [x] 1.2 创建设备检测组合式函数

    - 创建 `frontend/src/composables/useDevice.ts`
    - 实现 `isMobile`、`isTablet`、`isDesktop` 响应式状态
    - 实现窗口 resize 监听和清理
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 1.3 编写 useDevice 属性测试
    - **Property 3: 触摸区域最小尺寸**
    - **Validates: Requirements 11.1**

- [x] 2. 实现移动端布局组件

  - [x] 2.1 创建移动端顶部栏组件

    - 创建 `frontend/src/components/mobile/MobileHeader.vue`
    - 实现标题显示、返回按钮、右侧操作插槽
    - 添加固定定位和阴影样式
    - _Requirements: 2.4_

  - [x] 2.2 创建底部标签栏组件

    - 创建 `frontend/src/components/mobile/MobileTabBar.vue`
    - 实现 5 个标签项：首页、记账、账单、统计、我的
    - 实现路由跳转和激活状态
    - 确保触摸区域 >= 44px
    - _Requirements: 2.1, 2.2, 11.1_

  - [x] 2.3 创建移动端布局容器

    - 创建 `frontend/src/layouts/MobileLayout.vue`
    - 集成 MobileHeader 和 MobileTabBar
    - 实现内容区域滚动
    - _Requirements: 2.1, 2.4_

  - [x] 2.4 修改路由配置支持双布局
    - 修改 `frontend/src/router/index.ts`
    - 根据设备类型动态选择布局组件
    - 添加"我的"页面路由 `/profile`
    - _Requirements: 2.1, 2.3_

- [x] 3. 检查点 - 基础布局验证

  - 确保移动端布局正确显示
  - 确保桌面端布局不受影响
  - 确保所有测试通过，如有问题请询问用户

- [x] 4. 实现移动端交互组件

  - [x] 4.1 创建下拉刷新组件

    - 创建 `frontend/src/components/mobile/PullRefresh.vue`
    - 实现触摸下拉检测和状态管理
    - 实现加载动画和文字提示
    - _Requirements: 3.4_

  - [x] 4.2 创建滑动操作组件

    - 创建 `frontend/src/components/mobile/SwipeAction.vue`
    - 实现左滑显示操作按钮
    - 实现滑动阈值和回弹动画
    - _Requirements: 5.3, 9.5_

  - [x] 4.3 创建底部弹出面板组件

    - 创建 `frontend/src/components/mobile/BottomSheet.vue`
    - 实现显示/隐藏动画
    - 实现拖拽关闭
    - _Requirements: 5.5, 9.4_

  - [x] 4.4 编写触摸交互属性测试
    - **Property 4: 触摸反馈一致性**
    - **Validates: Requirements 11.2**

- [x] 5. 适配首页仪表盘

  - [x] 5.1 修改 DashboardView 响应式布局

    - 修改 `frontend/src/views/dashboard/DashboardView.vue`
    - 移动端统计卡片垂直排列
    - 移动端最近交易和预算概览垂直堆叠
    - 添加响应式样式
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 5.2 集成下拉刷新功能
    - 在首页包裹 PullRefresh 组件
    - 实现刷新时重新加载数据
    - _Requirements: 3.4_

- [x] 6. 适配快捷记账页面

  - [x] 6.1 修改 QuickAdd 响应式布局

    - 修改 `frontend/src/views/transaction/QuickAdd.vue`
    - 移动端全屏显示
    - 分类网格改为 4 列
    - 金额输入使用 `inputmode="decimal"`
    - _Requirements: 4.1, 4.2, 4.3, 11.4_

  - [x] 6.2 优化移动端日期选择

    - 使用 Element Plus 移动端友好的日期选择器
    - 添加触摸友好的样式
    - _Requirements: 4.4_

  - [x] 6.3 添加记账成功反馈

    - 实现成功动画效果
    - 成功后自动返回上一页
    - _Requirements: 4.6_

  - [x] 6.4 编写表单输入类型属性测试
    - **Property 5: 表单输入类型正确性**
    - **Validates: Requirements 11.4**

- [x] 7. 检查点 - 核心功能验证

  - 确保首页和记账页面在移动端正常工作
  - 确保所有测试通过，如有问题请询问用户

- [x] 8. 适配账单明细页面

  - [x] 8.1 创建移动端交易卡片组件

    - 创建 `frontend/src/components/mobile/TransactionCard.vue`
    - 显示分类图标、金额、备注、日期
    - 集成 SwipeAction 实现左滑操作
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 8.2 修改 TransactionList 响应式布局

    - 修改 `frontend/src/views/transaction/TransactionList.vue`
    - 移动端使用卡片列表替代表格
    - 实现无限滚动加载
    - _Requirements: 5.1, 5.6_

  - [x] 8.3 实现移动端筛选面板

    - 使用 BottomSheet 组件显示筛选选项
    - 替代桌面端的下拉菜单
    - _Requirements: 5.5_

  - [x] 8.4 实现交易详情弹窗

    - 点击卡片显示详情 BottomSheet
    - 显示完整交易信息和操作按钮
    - _Requirements: 5.4_

  - [x] 8.5 编写交易卡片内容属性测试
    - **Property 1: 交易卡片内容完整性**
    - **Validates: Requirements 5.2**

- [x] 9. 适配统计报表页面

  - [x] 9.1 修改 MonthlyReport 响应式布局

    - 修改 `frontend/src/views/statistics/MonthlyReport.vue`
    - 图表自适应屏幕宽度
    - 统计卡片垂直排列
    - _Requirements: 6.1_

  - [x] 9.2 修改 YearlyReport 响应式布局

    - 修改 `frontend/src/views/statistics/YearlyReport.vue`
    - 使用标签页切换月度/年度
    - 分类明细使用手风琴样式
    - _Requirements: 6.3, 6.4_

  - [x] 9.3 优化图表触摸交互
    - 配置 ECharts 触摸友好选项
    - 点击显示详细数据提示
    - _Requirements: 6.2, 6.5_

- [x] 10. 适配预算管理页面

  - [x] 10.1 创建移动端预算卡片组件

    - 创建 `frontend/src/components/mobile/BudgetCard.vue`
    - 显示分类名称、进度条、金额
    - 进度条使用更粗样式
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 10.2 修改 BudgetManage 响应式布局

    - 修改 `frontend/src/views/budget/BudgetManage.vue`
    - 移动端使用卡片列表
    - 点击卡片显示详情和编辑
    - _Requirements: 7.1, 7.3_

  - [x] 10.3 实现预算表单弹窗

    - 添加预算使用全屏表单或 BottomSheet
    - _Requirements: 7.4_

  - [x] 10.4 编写预算卡片内容属性测试
    - **Property 2: 预算卡片内容完整性**
    - **Validates: Requirements 7.2**

- [x] 11. 检查点 - 主要功能验证

  - 确保账单、统计、预算页面在移动端正常工作
  - 确保所有测试通过，如有问题请询问用户

- [x] 12. 适配家庭管理页面

  - [x] 12.1 修改 FamilyManage 响应式布局

    - 修改 `frontend/src/views/family/FamilyManage.vue`
    - 移动端使用卡片展示家庭信息
    - 成员列表使用紧凑布局
    - _Requirements: 8.1, 8.2_

  - [x] 12.2 添加邀请码二维码功能

    - 生成邀请码时显示二维码
    - 支持复制邀请码
    - _Requirements: 8.3_

  - [x] 12.3 修改 FamilyTransactions 响应式布局
    - 修改 `frontend/src/views/family/FamilyTransactions.vue`
    - 复用账单明细的移动端布局
    - 添加家庭切换下拉选择器
    - _Requirements: 8.4, 8.5_

- [x] 13. 适配设置页面

  - [x] 13.1 创建"我的"页面

    - 创建 `frontend/src/views/profile/ProfileView.vue`
    - 显示用户信息和设置入口列表
    - 使用分组样式
    - _Requirements: 2.3, 9.1, 9.2_

  - [x] 13.2 修改 AccountManage 响应式布局

    - 修改 `frontend/src/views/settings/AccountManage.vue`
    - 移动端使用全屏列表
    - 添加/编辑使用 BottomSheet
    - 删除使用左滑操作
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 13.3 修改 CategoryManage 响应式布局

    - 修改 `frontend/src/views/settings/CategoryManage.vue`
    - 同 AccountManage 适配方案
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 13.4 修改 BillTypeManage 响应式布局
    - 修改 `frontend/src/views/settings/BillTypeManage.vue`
    - 同 AccountManage 适配方案
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 14. 适配 AI 助手页面

  - [x] 14.1 修改 AIAssistant 响应式布局

    - 修改 `frontend/src/views/ai/AIAssistant.vue`
    - 移动端全屏聊天界面
    - 输入框固定底部
    - _Requirements: 10.1, 10.2_

  - [x] 14.2 优化 AI 结果展示

    - 分析结果使用可折叠卡片
    - 快捷问题使用横向滚动标签
    - _Requirements: 10.3, 10.4_

  - [x] 14.3 处理键盘弹出布局
    - 监听键盘事件调整布局
    - 避免输入框被遮挡
    - _Requirements: 10.5_

- [x] 15. 性能优化

  - [x] 15.1 实现路由懒加载

    - 修改路由配置使用动态导入
    - 减少首屏加载时间
    - _Requirements: 12.1_

  - [x] 15.2 实现图表按需加载

    - ECharts 组件使用动态导入
    - 只在需要时加载图表模块
    - _Requirements: 12.2_

  - [x] 15.3 添加骨架屏组件
    - 创建 `frontend/src/components/common/Skeleton.vue`
    - 在数据加载时显示骨架屏
    - _Requirements: 12.5_

- [x] 16. 最终检查点
  - 确保所有页面在移动端正常工作
  - 确保桌面端功能不受影响
  - 确保所有测试通过
  - 如有问题请询问用户

## 备注

- 所有任务均为必需任务，包括属性测试
- 每个任务都引用了具体的需求编号以便追溯
- 检查点任务用于阶段性验证，确保增量开发的稳定性
- 属性测试验证通用的正确性属性，确保代码质量
