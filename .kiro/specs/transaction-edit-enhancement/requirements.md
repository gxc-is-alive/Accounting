# 需求文档

## 介绍

本功能旨在增强家庭记账应用的交易编辑和添加体验。当前系统存在两个主要痛点：1) 已记录的交易无法修改支出账户，导致用户选错账户后只能删除重建；2) 当账户和分类数量较多时，卡片选择器查找效率低下。本功能将解决这两个问题，提升用户操作效率和灵活性。

## 术语表

- **Transaction（交易）**: 用户记录的一笔收入或支出记录
- **Account（账户）**: 用户的资金账户，如支付宝、微信、银行卡等
- **Category（分类）**: 交易的分类，如餐饮、交通、购物等
- **Account_Selector（账户选择器）**: AccountCardSelector 组件，用于选择账户
- **Category_Selector（分类选择器）**: CategoryCardSelector 组件，用于选择分类
- **Transaction_Editor（交易编辑器）**: TransactionList 组件中的编辑对话框
- **Quick_Add（快速添加）**: QuickAdd 组件，用于快速添加交易
- **Balance（余额）**: 账户的当前资金余额

## 需求

### 需求 1：编辑交易时支持修改账户

**用户故事：** 作为用户，我希望在编辑已记录的交易时能够修改支出账户，以便纠正选错的账户而无需删除重建。

#### 验收标准

1. WHEN 用户打开交易编辑对话框 THEN THE Transaction_Editor SHALL 显示账户选择器组件
2. WHEN 用户在编辑对话框中选择不同的账户 THEN THE Transaction_Editor SHALL 允许账户变更
3. WHEN 用户保存修改后的交易 THEN THE System SHALL 更新交易的账户信息
4. WHEN 交易的账户被修改 THEN THE System SHALL 调整原账户和新账户的余额
5. WHEN 账户余额调整时 THEN THE System SHALL 确保原账户余额增加交易金额，新账户余额减少交易金额（支出类型）
6. WHEN 账户余额调整时 THEN THE System SHALL 确保原账户余额减少交易金额，新账户余额增加交易金额（收入类型）

### 需求 2：账户选择器支持搜索功能

**用户故事：** 作为用户，我希望在选择账户时能够通过搜索快速找到目标账户，以便在账户数量较多时提高操作效率。

#### 验收标准

1. WHEN 账户选择器显示时 THEN THE Account_Selector SHALL 在卡片列表上方显示搜索输入框
2. WHEN 用户在搜索框中输入文本 THEN THE Account_Selector SHALL 实时过滤显示匹配的账户卡片
3. WHEN 搜索匹配账户名称 THEN THE Account_Selector SHALL 使用不区分大小写的部分匹配算法
4. WHEN 搜索结果为空 THEN THE Account_Selector SHALL 显示"未找到匹配的账户"提示信息
5. WHEN 用户清空搜索框 THEN THE Account_Selector SHALL 恢复显示所有账户卡片
6. WHEN 用户在搜索结果中选择账户 THEN THE Account_Selector SHALL 正常触发选择事件

### 需求 3：分类选择器支持搜索功能

**用户故事：** 作为用户，我希望在选择分类时能够通过搜索快速找到目标分类，以便在分类数量较多时提高操作效率。

#### 验收标准

1. WHEN 分类选择器显示时 THEN THE Category_Selector SHALL 在卡片列表上方显示搜索输入框
2. WHEN 用户在搜索框中输入文本 THEN THE Category_Selector SHALL 实时过滤显示匹配的分类卡片
3. WHEN 搜索匹配分类名称 THEN THE Category_Selector SHALL 使用不区分大小写的部分匹配算法
4. WHEN 搜索结果为空 THEN THE Category_Selector SHALL 显示"未找到匹配的分类"提示信息
5. WHEN 用户清空搜索框 THEN THE Category_Selector SHALL 恢复显示所有分类卡片
6. WHEN 用户在搜索结果中选择分类 THEN THE Category_Selector SHALL 正常触发选择事件

### 需求 4：数据一致性保证

**用户故事：** 作为系统管理员，我希望在账户修改时能够保证数据一致性，以便确保账户余额始终准确。

#### 验收标准

1. WHEN 修改交易账户的请求失败 THEN THE System SHALL 回滚所有余额变更
2. WHEN 修改交易账户 THEN THE System SHALL 在数据库事务中执行所有余额更新操作
3. WHEN 并发修改同一交易 THEN THE System SHALL 使用乐观锁或悲观锁防止数据冲突
4. WHEN 账户余额更新完成 THEN THE System SHALL 验证余额计算的正确性
