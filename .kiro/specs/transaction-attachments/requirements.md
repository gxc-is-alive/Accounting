# Requirements Document

## Introduction

本功能为记账系统添加附件上传能力，允许用户在记录交易时上传相关凭证，如发票、菜单、收据等图片或文档。这有助于用户更好地管理财务记录，便于日后查阅和报销。

## Glossary

- **Attachment_Service**: 负责处理附件上传、存储和管理的后端服务
- **File_Storage**: 文件存储系统，用于保存上传的附件文件
- **Transaction_Attachment**: 交易附件关联记录，存储交易与附件的对应关系
- **Upload_Component**: 前端文件上传组件
- **Preview_Component**: 附件预览组件，支持图片和文档预览

## Requirements

### Requirement 1: 附件上传

**User Story:** As a 用户, I want 在记账时上传附件, so that 我可以保存发票、菜单等凭证以便日后查阅。

#### Acceptance Criteria

1. WHEN 用户在记账页面点击上传按钮 THEN Upload_Component SHALL 显示文件选择器
2. WHEN 用户选择文件 THEN Upload_Component SHALL 验证文件类型和大小
3. WHEN 文件验证通过 THEN Attachment_Service SHALL 上传文件到 File_Storage
4. WHEN 上传成功 THEN Upload_Component SHALL 显示文件预览缩略图
5. WHEN 用户提交交易 THEN Attachment_Service SHALL 将附件与交易关联
6. THE Upload_Component SHALL 支持拖拽上传文件
7. THE Upload_Component SHALL 支持同时上传多个文件（最多 5 个）

### Requirement 2: 文件类型支持

**User Story:** As a 用户, I want 上传多种格式的文件, so that 我可以保存不同类型的凭证。

#### Acceptance Criteria

1. THE Attachment_Service SHALL 支持图片格式：JPG、PNG、GIF、WEBP
2. THE Attachment_Service SHALL 支持文档格式：PDF
3. THE Attachment_Service SHALL 支持视频格式：MP4、MOV（可选）
4. WHEN 用户上传不支持的文件类型 THEN Attachment_Service SHALL 返回明确的错误提示
5. THE Attachment_Service SHALL 限制单个文件大小不超过 10MB
6. THE Attachment_Service SHALL 限制视频文件大小不超过 50MB

### Requirement 3: 附件预览

**User Story:** As a 用户, I want 预览已上传的附件, so that 我可以确认上传的内容正确。

#### Acceptance Criteria

1. WHEN 用户点击图片附件 THEN Preview_Component SHALL 显示图片大图预览
2. WHEN 用户点击 PDF 附件 THEN Preview_Component SHALL 在新窗口打开 PDF
3. WHEN 用户点击视频附件 THEN Preview_Component SHALL 显示视频播放器
4. THE Preview_Component SHALL 支持图片缩放和旋转
5. WHEN 预览多个图片时 THEN Preview_Component SHALL 支持左右切换

### Requirement 4: 附件管理

**User Story:** As a 用户, I want 管理已上传的附件, so that 我可以删除错误上传的文件或补充新文件。

#### Acceptance Criteria

1. WHEN 用户在编辑交易时 THEN Upload_Component SHALL 显示已关联的附件列表
2. WHEN 用户点击删除按钮 THEN Attachment_Service SHALL 移除附件关联
3. WHEN 用户添加新附件 THEN Attachment_Service SHALL 追加到现有附件列表
4. WHEN 交易被删除 THEN Attachment_Service SHALL 同时删除关联的附件文件

### Requirement 5: 附件展示

**User Story:** As a 用户, I want 在账单列表中看到附件标识, so that 我可以快速识别哪些交易有凭证。

#### Acceptance Criteria

1. WHEN 交易有附件时 THEN 账单列表 SHALL 显示附件图标
2. WHEN 用户查看交易详情 THEN 详情页 SHALL 显示附件缩略图列表
3. THE 附件缩略图 SHALL 显示文件类型图标（图片显示缩略图，其他显示类型图标）

### Requirement 6: 移动端适配

**User Story:** As a 移动端用户, I want 在手机上方便地上传附件, so that 我可以随时拍照记录凭证。

#### Acceptance Criteria

1. WHEN 在移动端点击上传 THEN Upload_Component SHALL 提供拍照和相册选择选项
2. THE Upload_Component SHALL 支持移动端触摸手势操作
3. WHEN 上传图片时 THEN Attachment_Service SHALL 自动压缩大尺寸图片
4. THE Preview_Component SHALL 支持移动端手势缩放

### Requirement 7: 存储安全

**User Story:** As a 系统管理员, I want 确保附件存储安全, so that 用户数据得到保护。

#### Acceptance Criteria

1. THE File_Storage SHALL 使用唯一文件名存储文件（避免覆盖）
2. THE Attachment_Service SHALL 验证用户只能访问自己的附件
3. THE File_Storage SHALL 支持配置本地存储或云存储（如 S3）
4. WHEN 生成附件访问链接 THEN Attachment_Service SHALL 使用带签名的临时链接
