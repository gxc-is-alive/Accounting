# Implementation Plan: Transaction Attachments

## Overview

实现交易附件上传功能，允许用户在记账时上传图片、PDF、视频等凭证。采用渐进式实现，先完成核心上传功能，再扩展预览和管理功能。

## Tasks

- [x] 1. 后端基础设施

  - [x] 1.1 创建 Attachment 模型和数据库迁移
    - 创建 `backend/src/models/Attachment.ts`
    - 创建迁移脚本 `backend/src/scripts/migrations/002_add_attachments_table.sql`
    - 定义 AttachmentAttributes 接口
    - _Requirements: 1.5, 4.4_
  - [x] 1.2 实现 FileStorage 接口和本地存储
    - 创建 `backend/src/services/storage/fileStorage.interface.ts`
    - 创建 `backend/src/services/storage/localStorage.ts`
    - 实现 save、delete、getUrl、generateThumbnail 方法
    - _Requirements: 7.1, 7.3_
  - [x] 1.3 编写文件验证属性测试
    - **Property 1: File Validation Correctness**
    - **Validates: Requirements 1.2, 2.1-2.6**

- [x] 2. 附件服务实现

  - [x] 2.1 创建 AttachmentService
    - 创建 `backend/src/services/attachment.service.ts`
    - 实现 upload、validateFile 方法
    - 实现文件类型和大小验证
    - _Requirements: 1.2, 2.1-2.6_
  - [x] 2.2 实现附件关联和查询
    - 实现 linkToTransaction、getByTransactionId 方法
    - 实现 delete、deleteByTransactionId 方法
    - _Requirements: 1.5, 4.2, 4.3, 4.4_
  - [x] 2.3 编写附件关联属性测试
    - **Property 3: Transaction-Attachment Association**
    - **Validates: Requirements 1.5, 4.1**
  - [x] 2.4 编写唯一路径属性测试
    - **Property 5: Unique Storage Path**
    - **Validates: Requirements 7.1**

- [x] 3. 附件 API 端点

  - [x] 3.1 创建 AttachmentController
    - 创建 `backend/src/controllers/attachment.controller.ts`
    - 配置 Multer 中间件
    - 实现 POST /api/attachments/upload 端点
    - _Requirements: 1.3_
  - [x] 3.2 实现附件管理端点
    - 实现 GET /api/attachments/:id
    - 实现 GET /api/attachments/transaction/:transactionId
    - 实现 DELETE /api/attachments/:id
    - 实现 POST /api/attachments/link
    - _Requirements: 4.1, 4.2_
  - [x] 3.3 创建路由配置
    - 创建 `backend/src/routes/attachment.routes.ts`
    - 注册到主路由
    - _Requirements: 1.3_
  - [x] 3.4 编写访问控制属性测试
    - **Property 6: Access Control**
    - **Validates: Requirements 7.2**

- [x] 4. Checkpoint - 后端功能验证

  - 确保所有后端测试通过
  - 使用 Postman/curl 测试上传 API
  - 如有问题请询问用户

- [x] 5. 前端上传组件

  - [x] 5.1 创建 AttachmentUpload 组件
    - 创建 `frontend/src/components/attachment/AttachmentUpload.vue`
    - 使用 el-upload 实现拖拽上传
    - 实现文件类型和大小前端验证
    - _Requirements: 1.1, 1.6, 1.7_
  - [x] 5.2 扩展前端 API
    - 在 `frontend/src/api/index.ts` 添加 attachmentApi
    - 实现 upload、list、delete、link 方法
    - _Requirements: 1.3_
  - [x] 5.3 扩展前端类型定义
    - 在 `frontend/src/types/index.ts` 添加 Attachment 类型
    - _Requirements: 1.5_

- [x] 6. 集成到记账页面

  - [x] 6.1 更新 QuickAdd 页面
    - 在 `frontend/src/views/transaction/QuickAdd.vue` 添加附件上传区域
    - 提交时关联附件到交易
    - _Requirements: 1.5_
  - [x] 6.2 更新 TransactionStore
    - 修改 createTransaction 支持附件 ID 列表
    - _Requirements: 1.5_
  - [x] 6.3 编写附件数量限制属性测试
    - **Property 2: Attachment Count Limit**
    - **Validates: Requirements 1.7**

- [x] 7. 附件预览功能

  - [x] 7.1 创建 AttachmentPreview 组件
    - 创建 `frontend/src/components/attachment/AttachmentPreview.vue`
    - 实现图片大图预览（使用 el-image-viewer）
    - 实现 PDF 新窗口打开
    - 实现视频播放器
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  - [x] 7.2 创建 AttachmentList 组件
    - 创建 `frontend/src/components/attachment/AttachmentList.vue`
    - 显示缩略图或文件类型图标
    - 点击触发预览
    - _Requirements: 5.2, 5.3_

- [x] 8. 账单列表附件标识

  - [x] 8.1 更新 TransactionCard 组件
    - 在 `frontend/src/components/mobile/TransactionCard.vue` 添加附件图标
    - 有附件时显示 📎 图标
    - _Requirements: 5.1_
  - [x] 8.2 更新 TransactionList 页面
    - 在交易详情中显示附件列表
    - _Requirements: 5.2_
  - [x] 8.3 编写附件图标显示属性测试
    - **Property 8: Attachment Icon Display**
    - **Validates: Requirements 5.1**

- [x] 9. 附件管理功能

  - [x] 9.1 实现附件删除
    - 在 AttachmentUpload 组件添加删除按钮
    - 调用 API 删除附件
    - _Requirements: 4.2_
  - [x] 9.2 实现交易编辑时的附件管理
    - 编辑交易时加载已有附件
    - 支持添加和删除附件
    - _Requirements: 4.1, 4.3_
  - [x] 9.3 编写级联删除属性测试
    - **Property 4: Attachment Deletion Cascade**
    - **Validates: Requirements 4.4**

- [x] 10. 移动端优化

  - [x] 10.1 移动端上传适配
    - 添加拍照和相册选择选项
    - 优化触摸交互
    - _Requirements: 6.1, 6.2_
  - [x] 10.2 图片压缩
    - 上传前压缩大尺寸图片
    - 保持合理质量
    - _Requirements: 6.3_
  - [x] 10.3 编写缩略图生成属性测试
    - **Property 7: Thumbnail Generation for Images**
    - **Validates: Requirements 5.3, 6.3**

- [x] 11. Final Checkpoint
  - 确保所有测试通过
  - 使用 Playwright 进行端到端测试
  - 如有问题请询问用户

## Notes

- 所有属性测试任务均为必需
- 文件存储默认使用本地存储，可通过环境变量切换到 S3
- 缩略图使用 sharp 库生成
- 前端使用 Element Plus 的 el-upload 组件
