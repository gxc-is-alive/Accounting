# 需求文档：家庭记账系统

## 简介

家庭记账系统是一个支持个人和家庭共同记账的 Web 应用。用户可以独立管理个人账目，也可以创建或加入家庭，与家庭成员共享账目信息，实现家庭财务的透明化管理。

## 术语表

- **User（用户）**: 系统中的注册用户，拥有独立账户
- **Family（家庭）**: 由多个用户组成的群组，共享家庭账目
- **Transaction（交易记录）**: 一笔收入或支出的记录
- **Category（分类）**: 交易的类型分类，如餐饮、交通、工资等
- **Account（账户）**: 用户的资金账户，如现金、银行卡、支付宝等
- **Budget（预算）**: 针对某个分类或整体设置的支出限额
- **Family_Member（家庭成员）**: 家庭中的用户，具有不同角色权限
- **AI_Service（AI 服务）**: 集成 DeepSeek API 的智能分析服务
- **Bill_Type（账单类型）**: 交易的场景类型，如日常消费、固定支出、人情往来、投资理财等

## 需求

### 需求 1：用户注册与登录

**用户故事：** 作为一个新用户，我希望能够注册账户并登录系统，以便开始使用记账功能。

#### 验收标准

1. WHEN 用户提交有效的邮箱、密码和昵称 THEN User_Service SHALL 创建新用户账户并返回成功信息
2. WHEN 用户提交已存在的邮箱进行注册 THEN User_Service SHALL 拒绝注册并返回邮箱已存在的错误
3. WHEN 用户提交正确的邮箱和密码登录 THEN Auth_Service SHALL 验证凭据并返回访问令牌
4. WHEN 用户提交错误的登录凭据 THEN Auth_Service SHALL 拒绝登录并返回认证失败错误
5. WHEN 用户请求退出登录 THEN Auth_Service SHALL 使当前令牌失效

### 需求 2：个人账户管理

**用户故事：** 作为一个用户，我希望能够管理我的资金账户（如银行卡、现金、支付宝），以便准确记录资金来源。

#### 验收标准

1. WHEN 用户创建新账户时提供名称和初始余额 THEN Account_Service SHALL 创建账户并设置初始余额
2. WHEN 用户查看账户列表 THEN Account_Service SHALL 返回该用户所有账户及当前余额
3. WHEN 用户编辑账户信息 THEN Account_Service SHALL 更新账户名称或其他属性
4. WHEN 用户删除一个有交易记录的账户 THEN Account_Service SHALL 拒绝删除并提示存在关联记录
5. WHEN 用户删除一个无交易记录的账户 THEN Account_Service SHALL 删除该账户

### 需求 3：交易记录管理

**用户故事：** 作为一个用户，我希望能够记录我的收入和支出，以便追踪我的财务状况。

#### 验收标准

1. WHEN 用户创建支出记录时提供金额、分类、账户和日期 THEN Transaction_Service SHALL 创建记录并从账户扣减余额
2. WHEN 用户创建收入记录时提供金额、分类、账户和日期 THEN Transaction_Service SHALL 创建记录并增加账户余额
3. WHEN 用户编辑交易记录 THEN Transaction_Service SHALL 更新记录并相应调整账户余额
4. WHEN 用户删除交易记录 THEN Transaction_Service SHALL 删除记录并恢复账户余额
5. WHEN 用户按日期范围查询交易记录 THEN Transaction_Service SHALL 返回该范围内的所有记录
6. WHEN 用户按分类筛选交易记录 THEN Transaction_Service SHALL 返回该分类下的所有记录

### 需求 4：分类管理

**用户故事：** 作为一个用户，我希望能够管理收支分类，以便更好地组织我的账目。

#### 验收标准

1. THE Category_Service SHALL 提供系统预设的常用分类（餐饮、交通、购物、工资等）
2. WHEN 用户创建自定义分类 THEN Category_Service SHALL 创建属于该用户的私有分类
3. WHEN 用户编辑自定义分类 THEN Category_Service SHALL 更新分类名称或图标
4. WHEN 用户删除有关联交易的分类 THEN Category_Service SHALL 拒绝删除并提示存在关联记录
5. WHEN 用户查看分类列表 THEN Category_Service SHALL 返回系统分类和用户自定义分类

### 需求 5：账单类型管理

**用户故事：** 作为一个用户，我希望能够按账单类型区分不同场景的收支，以便更清晰地了解资金流向。

#### 验收标准

1. THE Bill_Type_Service SHALL 提供系统预设的账单类型：
   - 日常消费（餐饮、购物、交通等日常开销）
   - 固定支出（房租、水电、话费等周期性支出）
   - 人情往来（红包、礼金、请客等社交支出）
   - 投资理财（基金、股票、存款等投资类）
   - 工资收入（工资、奖金等劳动收入）
   - 其他收入（利息、退款、兼职等其他收入）
2. WHEN 用户创建交易记录 THEN UI SHALL 要求选择账单类型
3. WHEN 用户按账单类型筛选 THEN Transaction_Service SHALL 返回该类型下的所有记录
4. WHEN 用户查看账单类型统计 THEN Statistics_Service SHALL 返回各类型的收支汇总
5. WHEN 用户创建自定义账单类型 THEN Bill_Type_Service SHALL 创建属于该用户的私有类型
6. THE Statistics_Service SHALL 支持按账单类型生成独立报表

### 需求 6：家庭创建与管理

**用户故事：** 作为一个用户，我希望能够创建家庭并邀请家人加入，以便共同管理家庭财务。

#### 验收标准

1. WHEN 用户创建家庭时提供家庭名称 THEN Family_Service SHALL 创建家庭并将创建者设为管理员
2. WHEN 家庭管理员生成邀请码 THEN Family_Service SHALL 创建有时效性的邀请码
3. WHEN 用户使用有效邀请码加入家庭 THEN Family_Service SHALL 将用户添加为家庭成员
4. WHEN 用户使用过期或无效邀请码 THEN Family_Service SHALL 拒绝加入并返回错误
5. WHEN 家庭管理员移除成员 THEN Family_Service SHALL 将该成员从家庭中移除
6. WHEN 用户主动退出家庭 THEN Family_Service SHALL 将该用户从家庭中移除
7. WHEN 家庭只剩管理员一人且管理员退出 THEN Family_Service SHALL 解散该家庭

### 需求 7：家庭账目管理

**用户故事：** 作为一个家庭成员，我希望能够记录和查看家庭共同账目，以便了解家庭整体财务状况。

#### 验收标准

1. WHEN 家庭成员创建家庭交易记录 THEN Transaction_Service SHALL 创建记录并标记为家庭账目
2. WHEN 家庭成员查看家庭账目 THEN Transaction_Service SHALL 返回该家庭所有成员的家庭交易记录
3. WHEN 家庭成员编辑自己创建的家庭记录 THEN Transaction_Service SHALL 允许编辑
4. WHEN 家庭成员尝试编辑他人创建的家庭记录 THEN Transaction_Service SHALL 拒绝编辑（管理员除外）
5. WHEN 查看家庭账目统计 THEN Statistics_Service SHALL 返回家庭整体和各成员的收支统计

### 需求 8：统计与报表

**用户故事：** 作为一个用户，我希望能够查看收支统计和报表，以便分析我的消费习惯。

#### 验收标准

1. WHEN 用户查看月度统计 THEN Statistics_Service SHALL 返回该月收入、支出总额和结余
2. WHEN 用户查看分类统计 THEN Statistics_Service SHALL 返回各分类的支出占比
3. WHEN 用户查看趋势图表 THEN Statistics_Service SHALL 返回指定时间范围内的收支趋势数据
4. WHEN 用户查看年度报表 THEN Statistics_Service SHALL 返回全年各月的收支汇总

### 需求 9：预算管理

**用户故事：** 作为一个用户，我希望能够设置预算，以便控制我的支出。

#### 验收标准

1. WHEN 用户为某分类设置月度预算 THEN Budget_Service SHALL 创建预算记录
2. WHEN 用户支出接近预算限额（80%）THEN Budget_Service SHALL 发出预警提示
3. WHEN 用户支出超过预算限额 THEN Budget_Service SHALL 发出超支提醒
4. WHEN 用户查看预算执行情况 THEN Budget_Service SHALL 返回各预算的使用进度

### 需求 10：快捷记账体验

**用户故事：** 作为一个用户，我希望记账过程尽可能简单快捷，以便养成记账习惯。

#### 验收标准

1. WHEN 用户打开记账页面 THEN UI SHALL 默认显示支出类型和当天日期
2. WHEN 用户输入金额后 THEN UI SHALL 自动聚焦到分类选择
3. WHEN 用户选择分类后 THEN UI SHALL 允许一键提交或继续填写备注
4. THE UI SHALL 提供常用分类的快捷入口（最近使用的前 5 个分类）
5. WHEN 用户长按分类图标 THEN UI SHALL 快速创建该分类的支出记录
6. THE UI SHALL 支持语音输入记账内容
7. WHEN 用户输入自然语言描述（如"午餐花了 30 元"）THEN AI_Service SHALL 自动解析金额、分类和备注

### 需求 11：AI 智能分析

**用户故事：** 作为一个用户，我希望 AI 能够分析我的消费习惯并给出建议，以便更好地管理财务。

#### 验收标准

1. WHEN 用户请求 AI 分析 THEN AI_Service SHALL 调用 DeepSeek API 分析用户消费数据
2. WHEN AI 分析完成 THEN AI_Service SHALL 返回消费习惯总结和改进建议
3. WHEN 用户查看月度报告 THEN AI_Service SHALL 生成该月消费的智能点评
4. WHEN 用户消费出现异常模式 THEN AI_Service SHALL 主动提醒用户注意
5. WHEN 用户询问财务问题 THEN AI_Service SHALL 基于用户数据提供个性化回答
6. THE AI_Service SHALL 支持分析家庭整体消费并给出家庭理财建议

### 需求 12：数据安全与隐私

**用户故事：** 作为一个用户，我希望我的财务数据是安全的，只有我和我授权的家人能够访问。

#### 验收标准

1. THE Auth_Service SHALL 使用 JWT 进行身份验证
2. THE System SHALL 对用户密码进行加密存储
3. WHEN 用户访问个人数据 THEN Auth_Service SHALL 验证用户身份
4. WHEN 用户访问家庭数据 THEN Auth_Service SHALL 验证用户是否为家庭成员
5. WHEN 未授权用户尝试访问数据 THEN Auth_Service SHALL 拒绝访问并返回 403 错误
6. WHEN 调用 AI 分析 THEN AI_Service SHALL 仅发送脱敏的统计数据，不发送原始交易明细
