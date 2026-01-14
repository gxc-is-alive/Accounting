# Requirements Document

## Introduction

本功能旨在优化移动端账户管理的用户体验。当前账户管理在移动端使用 BottomSheet 弹窗来显示账户表单和详情，但在小屏幕设备上操作不便。本功能将为移动端设计独立的账户编辑/添加页面，提供更好的表单填写体验，同时保持桌面端现有的弹窗交互方式不变。

## Glossary

- **Account_Manager**: 账户管理系统，负责账户的增删改查操作
- **Mobile_Account_Form**: 移动端账户表单页面，用于添加或编辑账户
- **Device_Detector**: 设备检测器，用于判断当前设备类型（移动端/桌面端）
- **Account_List_Page**: 账户列表页面，展示所有账户信息
- **Credit_Account**: 信用账户，包含额度、账单日、还款日等额外字段

## Requirements

### Requirement 1: 移动端账户添加页面

**User Story:** As a 移动端用户, I want 在独立页面中添加新账户, so that 我可以在更大的表单空间中方便地填写账户信息。

#### Acceptance Criteria

1. WHEN 移动端用户在账户列表页点击添加按钮 THEN THE Account_Manager SHALL 导航到独立的账户添加页面
2. WHEN 用户在移动端账户添加页面填写完表单并提交 THEN THE Account_Manager SHALL 创建新账户并返回账户列表页
3. WHEN 用户在移动端账户添加页面点击取消或返回 THEN THE Account_Manager SHALL 放弃更改并返回账户列表页
4. THE Mobile_Account_Form SHALL 包含账户名称、账户类型、初始余额等必填字段
5. WHEN 用户选择信用卡类型 THEN THE Mobile_Account_Form SHALL 显示信用额度、账单日、还款日等额外字段

### Requirement 2: 移动端账户编辑页面

**User Story:** As a 移动端用户, I want 在独立页面中编辑账户信息, so that 我可以更方便地修改账户详情。

#### Acceptance Criteria

1. WHEN 移动端用户在账户列表页点击某个账户 THEN THE Account_Manager SHALL 导航到该账户的编辑页面
2. WHEN 用户在移动端账户编辑页面修改信息并提交 THEN THE Account_Manager SHALL 更新账户信息并返回账户列表页
3. THE Mobile_Account_Form SHALL 预填充当前账户的所有信息
4. WHEN 编辑信用账户时 THEN THE Mobile_Account_Form SHALL 显示并允许修改信用相关字段

### Requirement 3: 移动端账户删除功能

**User Story:** As a 移动端用户, I want 在账户编辑页面删除账户, so that 我可以移除不再使用的账户。

#### Acceptance Criteria

1. THE Mobile_Account_Form SHALL 在编辑模式下显示删除按钮
2. WHEN 用户点击删除按钮 THEN THE Account_Manager SHALL 显示确认对话框
3. WHEN 用户确认删除 THEN THE Account_Manager SHALL 删除账户并返回账户列表页
4. WHEN 用户取消删除 THEN THE Account_Manager SHALL 保持在当前编辑页面

### Requirement 4: 设备自适应路由

**User Story:** As a 用户, I want 系统根据设备类型自动选择合适的交互方式, so that 我在不同设备上都能获得最佳体验。

#### Acceptance Criteria

1. WHEN 桌面端用户操作账户 THEN THE Account_Manager SHALL 继续使用现有的弹窗交互方式
2. WHEN 移动端用户操作账户 THEN THE Account_Manager SHALL 使用独立页面交互方式
3. THE Device_Detector SHALL 使用 768px 作为移动端断点判断标准

### Requirement 5: 移动端页面导航体验

**User Story:** As a 移动端用户, I want 账户表单页面有清晰的导航, so that 我可以轻松返回上一页。

#### Acceptance Criteria

1. THE Mobile_Account_Form SHALL 在页面顶部显示标题和返回按钮
2. WHEN 用户点击返回按钮 THEN THE Account_Manager SHALL 返回账户列表页
3. THE Mobile_Account_Form SHALL 支持手机系统的返回手势操作
