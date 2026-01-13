# 需求文档

## 简介

优化新增账单页面的账户选择体验，将当前的下拉选择器改为与分类选择器一致的卡片式选择器，并实现智能排序功能，将最近使用和使用频率最高的账户优先展示，提升用户记账效率。

## 术语表

- **Account_Card_Selector**: 账户卡片选择器，以卡片网格形式展示账户供用户选择
- **Usage_Tracker**: 使用追踪器，记录账户的使用次数和最近使用时间
- **Smart_Sort**: 智能排序算法，根据使用频率和最近使用时间对账户进行排序
- **QuickAdd_Page**: 快速记账页面，用户新增账单的主要入口

## 需求

### 需求 1：账户卡片展示

**用户故事：** 作为用户，我希望账户选择以卡片形式展示，这样我可以更直观地看到所有账户并快速选择。

#### 验收标准

1. WHEN 用户进入新增账单页面 THEN Account_Card_Selector SHALL 以网格卡片形式展示所有可用账户
2. WHEN 账户卡片被展示 THEN Account_Card_Selector SHALL 显示账户名称和账户图标
3. WHEN 用户点击某个账户卡片 THEN Account_Card_Selector SHALL 将该账户标记为选中状态并提供视觉反馈
4. WHEN 账户被选中 THEN Account_Card_Selector SHALL 高亮显示选中的卡片，与分类选择器保持一致的视觉风格
5. WHEN 在移动端展示 THEN Account_Card_Selector SHALL 采用 4 列网格布局，与分类选择器保持一致

### 需求 2：账户使用记录追踪

**用户故事：** 作为系统，我需要追踪用户对每个账户的使用情况，以便实现智能排序功能。

#### 验收标准

1. WHEN 用户成功创建一笔交易 THEN Usage_Tracker SHALL 更新该账户的使用次数（加 1）
2. WHEN 用户成功创建一笔交易 THEN Usage_Tracker SHALL 更新该账户的最近使用时间为当前时间
3. WHEN 用户首次使用某账户 THEN Usage_Tracker SHALL 初始化该账户的使用次数为 1
4. THE Usage_Tracker SHALL 将使用记录持久化存储在本地存储（localStorage）中

### 需求 3：智能排序算法

**用户故事：** 作为用户，我希望最常用和最近使用的账户排在前面，这样我可以更快地找到想要的账户。

#### 验收标准

1. WHEN 账户列表被加载 THEN Smart_Sort SHALL 按照综合评分对账户进行降序排列
2. THE Smart_Sort SHALL 计算综合评分时考虑使用次数（权重 60%）和最近使用时间（权重 40%）
3. WHEN 两个账户的综合评分相同 THEN Smart_Sort SHALL 按账户创建时间升序排列（先创建的在前）
4. WHEN 账户从未被使用过 THEN Smart_Sort SHALL 将其排在已使用账户之后
5. WHEN 用户完成一笔交易后返回记账页面 THEN Smart_Sort SHALL 重新计算排序以反映最新的使用情况

### 需求 4：默认账户选择

**用户故事：** 作为用户，我希望系统能自动选择我最常用的账户作为默认值，减少我的操作步骤。

#### 验收标准

1. WHEN 用户进入新增账单页面且未手动选择账户 THEN QuickAdd_Page SHALL 自动选中排序后的第一个账户
2. WHEN 用户手动选择了其他账户 THEN QuickAdd_Page SHALL 保持用户的选择不变
3. IF 用户没有任何账户 THEN QuickAdd_Page SHALL 显示提示信息引导用户创建账户

### 需求 5：视觉一致性

**用户故事：** 作为用户，我希望账户选择器与分类选择器的视觉风格保持一致，提供统一的用户体验。

#### 验收标准

1. THE Account_Card_Selector SHALL 使用与分类选择器相同的卡片尺寸和间距
2. THE Account_Card_Selector SHALL 使用与分类选择器相同的选中状态样式（背景色、阴影等）
3. THE Account_Card_Selector SHALL 使用与分类选择器相同的悬停和点击动画效果
4. WHEN 在桌面端展示 THEN Account_Card_Selector SHALL 采用 5 列网格布局
5. WHEN 在移动端展示 THEN Account_Card_Selector SHALL 采用 4 列网格布局

### 需求 6：账户类型图标映射

**用户故事：** 作为用户，我希望每种账户类型都有对应的图标，这样我可以更快地识别账户。

#### 验收标准

1. THE Account_Card_Selector SHALL 为每种账户类型（cash、bank、alipay、wechat、credit、investment、other）提供默认图标
2. WHEN 账户有自定义图标 THEN Account_Card_Selector SHALL 优先显示自定义图标
3. WHEN 账户没有自定义图标 THEN Account_Card_Selector SHALL 显示该账户类型的默认图标
