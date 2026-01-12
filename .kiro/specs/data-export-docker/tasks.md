# 实现计划：数据导出与 Docker 部署

## 概述

本实现计划分为两个主要部分：数据导出功能（后端 API）和 Docker 容器化部署。采用增量开发方式，先实现核心导出功能，再添加 Docker 支持。

## 任务

- [x] 1. 实现数据导出服务核心功能

  - [x] 1.1 创建 ExportService 类和数据类型定义

    - 在 `backend/src/services/export.service.ts` 创建服务
    - 定义 ExportData、ImportResult 等接口
    - 实现 exportToJson 方法，查询并组装用户所有数据
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.2 编写 JSON 导出属性测试

    - **Property 1: 导出数据完整性**
    - **Validates: Requirements 1.1, 1.2, 1.4**

  - [x] 1.3 实现家庭数据导出功能

    - 扩展 exportToJson 支持 includeFamily 参数
    - 查询用户所属家庭及家庭交易记录
    - _Requirements: 1.3_

  - [x] 1.4 编写家庭数据导出属性测试
    - **Property 2: 家庭数据导出**
    - **Validates: Requirements 1.3**

- [x] 2. 实现 CSV 导出功能

  - [x] 2.1 实现 exportToCsv 方法

    - 查询交易记录并转换为 CSV 格式
    - 添加 UTF-8 BOM 头确保 Excel 兼容
    - 支持日期范围过滤参数
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.2 编写 CSV 导出属性测试
    - **Property 3: CSV 导出完整性**
    - **Property 4: CSV 日期范围过滤**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 3. 实现数据导入功能

  - [x] 3.1 实现 validateImportData 方法

    - 验证 JSON 结构和必需字段
    - 检查版本兼容性
    - 返回验证结果和错误信息
    - _Requirements: 3.1, 3.5_

  - [x] 3.2 编写导入验证属性测试

    - **Property 5: 导入数据验证**
    - **Validates: Requirements 3.1**

  - [x] 3.3 实现 importFromJson 方法

    - 支持 skip 和 overwrite 两种冲突处理模式
    - 按顺序导入：分类 → 账户 → 账单类型 → 交易 → 预算
    - 返回导入统计信息
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 3.4 编写导入功能属性测试
    - **Property 6: 导出-导入往返一致性**
    - **Property 7: 导入冲突处理**
    - **Property 8: 导入统计准确性**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 4. 创建导出 API 端点

  - [x] 4.1 创建 ExportController 和路由

    - 在 `backend/src/controllers/export.controller.ts` 创建控制器
    - 在 `backend/src/routes/export.routes.ts` 创建路由
    - GET /api/export/json - JSON 导出
    - GET /api/export/csv - CSV 导出（支持 startDate, endDate 参数）
    - POST /api/export/import - 数据导入
    - _Requirements: 1.1, 2.1, 3.2_

  - [x] 4.2 注册路由到主应用
    - 在 `backend/src/index.ts` 添加导出路由
    - _Requirements: 1.1, 2.1, 3.2_

- [x] 5. 检查点 - 确保所有测试通过

  - 运行所有测试，确保导出功能正常工作
  - 如有问题请询问用户

- [x] 6. 创建 Docker 配置文件

  - [x] 6.1 创建 Backend Dockerfile

    - 在 `backend/Dockerfile` 创建多阶段构建配置
    - 使用 node:18-alpine 基础镜像
    - _Requirements: 6.4_

  - [x] 6.2 创建 Frontend Dockerfile 和 Nginx 配置

    - 在 `frontend/Dockerfile` 创建多阶段构建配置
    - 在 `frontend/nginx.conf` 创建 Nginx 配置
    - 配置 API 代理到后端服务
    - _Requirements: 6.4_

  - [x] 6.3 创建 docker-compose.yml

    - 定义 mysql、backend、frontend 三个服务
    - 配置命名卷 mysql_data 持久化数据
    - 配置服务依赖和健康检查
    - 配置自动重启策略
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.5, 6.3, 6.5_

  - [x] 6.4 创建 docker-compose.prod.yml

    - 继承基础配置并添加生产环境优化
    - 配置容器资源限制
    - _Requirements: 6.1, 6.2_

  - [x] 6.5 创建 .env.docker 环境变量模板
    - 提供 Docker 部署所需的环境变量模板
    - _Requirements: 4.5_

- [x] 7. 更新文档

  - [x] 7.1 更新 README.md 添加 Docker 部署说明
    - 添加 Docker 快速启动指南
    - 添加数据卷备份说明
    - 添加数据导出/导入 API 说明
    - _Requirements: 5.4_

- [x] 8. 最终检查点
  - 确保所有测试通过
  - 验证 Docker 配置文件语法正确
  - 如有问题请询问用户

## 备注

- 每个任务都引用了具体的需求以便追溯
- 检查点确保增量验证
- 属性测试验证通用正确性属性
