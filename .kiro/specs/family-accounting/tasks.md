# 实现计划：家庭记账系统

## 概述

本计划将家庭记账系统的设计分解为可执行的编码任务，采用前后端分离架构，先搭建后端 API，再实现前端界面。

## 任务列表

- [x] 1. 项目初始化和基础架构

  - [x] 1.1 初始化后端项目结构
    - 创建 backend 目录，初始化 Node.js + TypeScript 项目
    - 安装依赖：express, sequelize, mysql2, jsonwebtoken, bcrypt, cors
    - 配置 TypeScript 和 ESLint
    - _Requirements: 12.1, 12.2_
  - [x] 1.2 初始化前端项目结构
    - 使用 Vite 创建 Vue 3 + TypeScript 项目
    - 安装依赖：pinia, vue-router, axios, element-plus, echarts
    - 配置路由和状态管理基础结构
    - _Requirements: 全局_
  - [x] 1.3 配置数据库连接和 Sequelize
    - 创建数据库配置文件
    - 配置 Sequelize ORM 连接 MySQL
    - 创建数据库初始化脚本
    - _Requirements: 全局_

- [x] 2. 用户认证模块

  - [x] 2.1 实现用户数据模型
    - 创建 User 模型（id, email, password, nickname, timestamps）
    - 实现密码加密存储（bcrypt）
    - _Requirements: 1.1, 12.2_
  - [x] 2.2 实现认证服务和 API
    - 实现注册接口 POST /api/auth/register
    - 实现登录接口 POST /api/auth/login（返回 JWT）
    - 实现获取当前用户 GET /api/auth/me
    - 实现退出登录 POST /api/auth/logout
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1_
  - [x] 2.3 实现 JWT 认证中间件
    - 创建 token 验证中间件
    - 实现 token 黑名单（退出登录）
    - _Requirements: 12.1, 12.3_
  - [x] 2.4 编写用户认证属性测试
    - **Property 1: 用户注册登录往返**
    - **Property 12: JWT 令牌有效性**
    - **Property 13: 密码加密存储**
    - **Validates: Requirements 1.1, 1.3, 12.1, 12.2**

- [x] 3. 检查点 - 确保认证模块测试通过

  - 运行所有测试，确保通过
  - 如有问题请询问用户

- [x] 4. 账户管理模块

  - [x] 4.1 实现账户数据模型
    - 创建 Account 模型（id, user_id, name, type, balance, icon）
    - 定义账户类型枚举（cash, bank, alipay, wechat, credit, other）
    - _Requirements: 2.1_
  - [x] 4.2 实现账户服务和 API
    - 实现创建账户 POST /api/accounts
    - 实现获取账户列表 GET /api/accounts
    - 实现更新账户 PUT /api/accounts/:id
    - 实现删除账户 DELETE /api/accounts/:id（检查关联交易）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. 分类和账单类型模块

  - [x] 5.1 实现分类数据模型
    - 创建 Category 模型（id, user_id, name, type, icon, parent_id, is_system）
    - 创建系统预设分类的种子数据
    - _Requirements: 4.1_
  - [x] 5.2 实现分类服务和 API
    - 实现获取分类列表 GET /api/categories
    - 实现创建自定义分类 POST /api/categories
    - 实现更新分类 PUT /api/categories/:id
    - 实现删除分类 DELETE /api/categories/:id
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  - [x] 5.3 实现账单类型数据模型和 API
    - 创建 BillType 模型（id, user_id, name, description, icon, is_system）
    - 创建系统预设账单类型的种子数据
    - 实现 CRUD API
    - _Requirements: 5.1, 5.5_

- [x] 6. 交易记录模块

  - [x] 6.1 实现交易记录数据模型
    - 创建 Transaction 模型
    - 定义与 Account, Category, BillType, User, Family 的关联
    - _Requirements: 3.1, 3.2_
  - [x] 6.2 实现交易记录服务
    - 实现创建交易（同时更新账户余额）
    - 实现编辑交易（调整账户余额差值）
    - 实现删除交易（恢复账户余额）
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 6.3 实现交易记录 API
    - 实现创建交易 POST /api/transactions
    - 实现获取交易列表 GET /api/transactions（支持筛选）
    - 实现更新交易 PUT /api/transactions/:id
    - 实现删除交易 DELETE /api/transactions/:id
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ] 6.4 编写交易记录属性测试
    - **Property 2: 账户余额不变量**
    - **Property 3: 交易删除往返**
    - **Property 4: 交易编辑余额调整**
    - **Property 5: 交易筛选正确性**
    - **Validates: Requirements 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

- [ ] 7. 检查点 - 确保交易模块测试通过

  - 运行所有测试，确保通过
  - 如有问题请询问用户

- [x] 8. 家庭模块

  - [x] 8.1 实现家庭数据模型
    - 创建 Family 模型（id, name, created_by）
    - 创建 FamilyMember 模型（id, family_id, user_id, role）
    - 创建 FamilyInvite 模型（id, family_id, code, expires_at, used）
    - _Requirements: 6.1_
  - [x] 8.2 实现家庭服务和 API
    - 实现创建家庭 POST /api/families
    - 实现生成邀请码 POST /api/families/:id/invite
    - 实现加入家庭 POST /api/families/join
    - 实现移除成员 DELETE /api/families/:id/members/:userId
    - 实现退出家庭 POST /api/families/:id/leave
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  - [ ] 8.3 实现家庭账目功能
    - 扩展交易 API 支持家庭账目标记
    - 实现家庭账目查询 GET /api/transactions?familyId=xxx
    - 实现家庭账目编辑权限控制
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  - [ ] 8.4 编写家庭模块属性测试
    - **Property 10: 家庭成员管理正确性**
    - **Property 11: 家庭账目可见性**
    - **Property 14: 访问控制正确性**
    - **Validates: Requirements 6.5, 6.6, 7.2, 12.3, 12.4, 12.5**

- [x] 9. 统计模块

  - [x] 9.1 实现统计服务
    - 实现月度统计计算（收入、支出、结余）
    - 实现分类统计计算（各分类金额和占比）
    - 实现趋势数据计算
    - 实现年度报表计算
    - 实现账单类型统计
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 5.4_
  - [x] 9.2 实现统计 API
    - 实现月度统计 GET /api/statistics/monthly
    - 实现分类统计 GET /api/statistics/category
    - 实现趋势数据 GET /api/statistics/trend
    - 实现年度报表 GET /api/statistics/yearly
    - 实现家庭统计 GET /api/statistics/family/:id
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 7.5_
  - [ ] 9.3 编写统计模块属性测试
    - **Property 6: 月度统计正确性**
    - **Property 7: 分类占比总和**
    - **Validates: Requirements 8.1, 8.2**

- [x] 10. 预算模块

  - [x] 10.1 实现预算数据模型和服务
    - 创建 Budget 模型（id, user_id, category_id, amount, month）
    - 实现预算 CRUD 操作
    - 实现预算执行状态计算
    - 实现预警逻辑（80% 预警，100% 超支）
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  - [x] 10.2 实现预算 API
    - 实现创建预算 POST /api/budgets
    - 实现获取预算列表 GET /api/budgets
    - 实现获取预算状态 GET /api/budgets/status
    - 实现更新/删除预算
    - _Requirements: 9.1, 9.4_
  - [ ] 10.3 编写预算模块属性测试
    - **Property 8: 预算预警正确触发**
    - **Property 9: 预算执行进度正确性**
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [ ] 11. 检查点 - 确保后端核心功能测试通过

  - 运行所有测试，确保通过
  - 如有问题请询问用户

- [x] 12. AI 智能分析模块

  - [x] 12.1 实现 DeepSeek API 集成
    - 创建 AI 服务配置（API Key, 模型参数）
    - 实现 DeepSeek API 调用封装
    - 实现数据脱敏处理
    - _Requirements: 11.1, 12.6_
  - [x] 12.2 实现 AI 自然语言解析
    - 实现记账文本解析 POST /api/ai/parse
    - 解析金额、类型、分类、备注
    - _Requirements: 10.7_
  - [x] 12.3 实现 AI 消费分析
    - 实现消费分析 POST /api/ai/analyze
    - 返回消费习惯总结和建议
    - _Requirements: 11.1, 11.2, 11.6_
  - [x] 12.4 实现 AI 财务问答
    - 实现问答接口 POST /api/ai/chat
    - 基于用户数据提供个性化回答
    - _Requirements: 11.5_
  - [ ] 12.5 编写 AI 模块属性测试
    - **Property 15: AI 数据脱敏**
    - **Property 17: AI 解析结构完整性**
    - **Validates: Requirements 10.7, 11.2, 12.6**

- [x] 13. 前端基础架构

  - [x] 13.1 实现前端路由和布局
    - 配置 Vue Router 路由表
    - 创建主布局组件（Header, Sidebar）
    - 实现路由守卫（登录验证）
    - _Requirements: 全局_
  - [x] 13.2 实现 API 客户端和状态管理
    - 创建 Axios 实例和拦截器
    - 实现 Pinia stores（user, transaction, family, statistics）
    - _Requirements: 全局_
  - [x] 13.3 实现公共组件
    - 创建 AmountInput 金额输入组件
    - 创建 CategorySelector 分类选择器
    - 创建 BillTypeSelector 账单类型选择器
    - 创建 DatePicker 日期选择器
    - _Requirements: 全局_

- [x] 14. 前端认证页面

  - [x] 14.1 实现登录和注册页面
    - 创建 LoginView 登录页面
    - 创建 RegisterView 注册页面
    - 实现表单验证和错误提示
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 15. 前端记账功能

  - [x] 15.1 实现快捷记账页面
    - 创建 QuickAdd 快捷记账组件
    - 实现金额输入、分类选择、账单类型选择
    - 实现常用分类快捷入口
    - 实现自然语言输入（调用 AI 解析）
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.7_
  - [x] 15.2 实现交易记录列表页面
    - 创建 TransactionList 页面
    - 实现日期范围筛选
    - 实现分类和账单类型筛选
    - 实现交易卡片展示
    - _Requirements: 3.5, 3.6, 5.3_
  - [x] 15.3 实现交易编辑功能
    - 创建 TransactionForm 编辑表单
    - 实现编辑和删除功能
    - _Requirements: 3.3, 3.4_
  - [ ] 15.4 编写常用分类属性测试
    - **Property 16: 常用分类正确性**
    - **Validates: Requirements 10.4**

- [ ] 16. 前端统计报表

  - [ ] 16.1 实现仪表盘首页
    - 创建 DashboardView 首页
    - 显示本月收支概览
    - 显示预算执行状态
    - 显示最近交易记录
    - _Requirements: 8.1, 9.4_
  - [ ] 16.2 实现统计图表页面
    - 创建 MonthlyReport 月度报表
    - 创建 YearlyReport 年度报表
    - 实现 PieChart 分类占比饼图
    - 实现 LineChart 趋势折线图
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 17. 前端家庭功能

  - [ ] 17.1 实现家庭管理页面
    - 创建 FamilyManage 家庭管理页面
    - 实现创建家庭功能
    - 实现邀请成员功能（生成邀请码）
    - 实现加入家庭功能
    - 实现成员管理（移除、退出）
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_
  - [ ] 17.2 实现家庭账目页面
    - 创建 FamilyTransactions 家庭账目页面
    - 显示家庭所有成员的交易记录
    - 实现家庭统计展示
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 18. 前端设置和 AI 功能

  - [x] 18.1 实现设置页面
    - 创建 AccountManage 账户管理页面
    - 创建 CategoryManage 分类管理页面
    - 创建 BillTypeManage 账单类型管理页面
    - _Requirements: 2.1, 2.2, 2.3, 4.2, 4.3, 5.5_
  - [x] 18.2 实现 AI 助手页面
    - 创建 AIAssistant AI 助手页面
    - 实现消费分析展示
    - 实现 AI 问答对话框
    - _Requirements: 11.1, 11.2, 11.5, 11.6_
  - [ ] 18.3 实现预算管理页面
    - 创建 BudgetManage 预算管理页面
    - 实现预算设置和编辑
    - 实现预算执行进度展示
    - 实现预警提示
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 19. 最终检查点 - 确保所有测试通过
  - 运行所有后端测试
  - 运行所有前端测试
  - 如有问题请询问用户

## 备注

- 所有任务均为必需任务
- 每个任务都引用了具体的需求编号以便追溯
- 检查点用于确保增量验证
- 属性测试验证核心业务逻辑的正确性
