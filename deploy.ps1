# 构建和推送 Docker 镜像到阿里云仓库
# 使用方法: .\deploy.ps1

$REGISTRY = "crpi-1jw9hqpudq1gxjjv.cn-shanghai.personal.cr.aliyuncs.com"
$NAMESPACE = "family-accounting"
$TAG = "latest"

Write-Host "========================================"
Write-Host "  家庭记账系统 - Docker 镜像构建推送"
Write-Host "========================================"

# 检查 Docker 是否运行
Write-Host ""
Write-Host "[1/5] 检查 Docker 状态..."
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: Docker 未运行，请先启动 Docker Desktop"
    exit 1
}
Write-Host "Docker 运行正常"

# 登录阿里云镜像仓库
Write-Host ""
Write-Host "[2/5] 登录阿里云镜像仓库..."
Write-Host "请输入阿里云镜像仓库密码:"
docker login $REGISTRY
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 登录失败"
    exit 1
}

# 构建后端镜像
Write-Host ""
Write-Host "[3/5] 构建后端镜像..."
$backendImage = "$REGISTRY/$NAMESPACE/backend:$TAG"
docker build -t $backendImage ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 后端镜像构建失败"
    exit 1
}
Write-Host "后端镜像构建成功: $backendImage"

# 构建前端镜像
Write-Host ""
Write-Host "[4/5] 构建前端镜像..."
$frontendImage = "$REGISTRY/$NAMESPACE/frontend:$TAG"
docker build -t $frontendImage ./frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 前端镜像构建失败"
    exit 1
}
Write-Host "前端镜像构建成功: $frontendImage"

# 推送镜像
Write-Host ""
Write-Host "[5/5] 推送镜像到阿里云仓库..."
docker push $backendImage
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 后端镜像推送失败"
    exit 1
}
Write-Host "后端镜像推送成功"

docker push $frontendImage
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 前端镜像推送失败"
    exit 1
}
Write-Host "前端镜像推送成功"

Write-Host ""
Write-Host "========================================"
Write-Host "  镜像构建推送完成！"
Write-Host "========================================"
Write-Host ""
Write-Host "后端镜像: $backendImage"
Write-Host "前端镜像: $frontendImage"
Write-Host ""
Write-Host "云服务器部署命令:"
Write-Host "  docker-compose -f docker-compose.cloud.yml pull"
Write-Host "  docker-compose -f docker-compose.cloud.yml up -d"
