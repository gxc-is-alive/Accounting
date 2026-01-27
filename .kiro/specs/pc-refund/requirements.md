# 需求文档

## 简介

PC 端退款功能为桌面用户提供与移动端相同的退款能力。用户可以在交易列表的桌面端布局中对支出交易发起退款，通过对话框形式完成退款操作。该功能复用现有的退款业务逻辑和后端 API，但采用适合桌面端的交互方式和视觉设计。

## 术语表

- **Desktop_Layout**: 桌面端布局，使用 Element Plus 表格和对话框组件
- **Refund_Dialog**: 退款对话框，使用 el-dialog 实现的退款表单容器
- **Transaction_Table**: 交易表格，显示交易列表的桌面端组件
- **Refund_Button**: 退款按钮，显示在交易表格操作列中
- **Refundable_Amount**: 可退款金额，原交易金额减去已退款金额
- **Refund_Form**: 退款表单组件，可在移动端和桌面端复用

## 需求

### 需求 1：交易表格中的退款入口

**用户故事：** 作为桌面端用户，我想要在交易表格中看到退款按钮，以便快速对支出交易发起退款。

#### 验收标准

1. WHEN 用户查看交易列表的桌面端布局 THEN THE Transaction_Table SHALL 在操作列显示"编辑"和"删除"按钮
2. WHEN 交易类型为支出（expense）且可退款金额大于零 THEN THE Transaction_Table SHALL 在操作列额外显示"退款"按钮
3. WHEN 交易类型为收入、还款或退款 THEN THE Transaction_Table SHALL NOT 显示退款按钮
4. WHEN 支出交易的可退款金额为零 THEN THE Transaction_Table SHALL NOT 显示退款按钮
5. WHEN 用户点击退款按钮 THEN THE System SHALL 打开退款对话框

### 需求 2：退款对话框显示

**用户故事：** 作为桌面端用户，我想要通过对话框完成退款操作，以便在不离开当前页面的情况下记录退款。

#### 验收标准

1. WHEN 用户点击退款按钮 THEN THE Refund_Dialog SHALL 以居中模态对话框形式显示
2. THE Refund_Dialog SHALL 宽度为 600px
3. THE Refund_Dialog SHALL 标题为"申请退款"
4. WHEN 对话框打开 THEN THE System SHALL 自动加载原交易的退款信息
5. WHEN 加载退款信息时 THEN THE Refund_Dialog SHALL 显示加载状态

### 需求 3：退款表单内容

**用户故事：** 作为桌面端用户，我想要在退款对话框中看到完整的退款信息，以便做出正确的退款决策。

#### 验收标准

1. THE Refund_Dialog SHALL 显示原交易信息区域，包括分类、金额、日期、备注
2. THE Refund_Dialog SHALL 高亮显示可退款金额
3. THE Refund_Dialog SHALL 提供退款金额输入框，使用 el-input-number 组件
4. THE Refund_Dialog SHALL 提供退款日期选择器，使用 el-date-picker 组件
5. THE Refund_Dialog SHALL 提供退款备注输入框，使用 el-input 组件
6. WHEN 可退款金额大于零 THEN THE Refund_Dialog SHALL 显示"全额退款"快捷按钮
7. WHEN 存在退款历史记录 THEN THE Refund_Dialog SHALL 显示退款记录列表

### 需求 4：退款金额验证

**用户故事：** 作为桌面端用户，我想要系统实时验证我输入的退款金额，以避免输入错误的金额。

#### 验收标准

1. THE System SHALL 验证退款金额必须大于零
2. THE System SHALL 验证退款金额不超过可退款金额
3. WHEN 退款金额无效 THEN THE System SHALL 在输入框下方显示错误提示
4. WHEN 退款金额有效 THEN THE System SHALL 允许提交退款
5. THE System SHALL 限制退款金额最多两位小数

### 需求 5：退款提交和反馈

**用户故事：** 作为桌面端用户，我想要清晰的退款提交反馈，以便知道退款是否成功。

#### 验收标准

1. WHEN 用户点击"确认退款"按钮 THEN THE System SHALL 验证表单数据
2. WHEN 表单验证失败 THEN THE System SHALL 显示验证错误信息
3. WHEN 表单验证通过 THEN THE System SHALL 提交退款请求到后端
4. WHEN 提交退款时 THEN THE System SHALL 在按钮上显示加载状态
5. WHEN 退款成功 THEN THE System SHALL 显示成功消息、关闭对话框、刷新交易列表
6. WHEN 退款失败 THEN THE System SHALL 显示错误消息、保持对话框打开

### 需求 6：组件复用和样式一致性

**用户故事：** 作为开发者，我想要复用现有的退款表单逻辑，以保持代码的可维护性和一致性。

#### 验收标准

1. THE System SHALL 复用 RefundForm 组件的业务逻辑
2. THE Refund_Dialog SHALL 使用 Element Plus 的设计风格
3. THE Refund_Dialog SHALL 与现有桌面端页面的视觉风格保持一致
4. THE System SHALL 使用与移动端相同的 API 接口
5. THE System SHALL 使用与移动端相同的数据验证规则

### 需求 7：用户体验优化

**用户故事：** 作为桌面端用户，我想要流畅的退款操作体验，以便高效地完成退款记录。

#### 验收标准

1. WHEN 对话框打开 THEN THE System SHALL 自动聚焦到退款金额输入框
2. WHEN 用户按 ESC 键 THEN THE System SHALL 关闭退款对话框
3. WHEN 用户点击对话框外部 THEN THE System SHALL 关闭退款对话框
4. WHEN 退款数据加载完成 THEN THE System SHALL 自动将可退款金额填入输入框
5. WHEN 用户点击"全额退款"按钮 THEN THE System SHALL 将可退款金额填入输入框
