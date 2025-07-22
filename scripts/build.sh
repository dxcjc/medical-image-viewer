#!/bin/bash

# 医学影像查看器构建脚本
# 用法: ./scripts/build.sh [环境]
# 环境: development, staging, production (默认: production)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取环境参数
ENVIRONMENT=${1:-production}
PROJECT_DIR="medical-image-viewer"

log_info "开始构建医学影像查看器 - 环境: $ENVIRONMENT"

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "项目目录 $PROJECT_DIR 不存在"
    exit 1
fi

cd "$PROJECT_DIR"

# 检查 Node.js 版本
NODE_VERSION=$(node --version)
log_info "Node.js 版本: $NODE_VERSION"

# 检查 npm 版本
NPM_VERSION=$(npm --version)
log_info "npm 版本: $NPM_VERSION"

# 清理之前的构建
log_info "清理之前的构建文件..."
rm -rf dist/
rm -rf node_modules/.cache/

# 安装依赖
log_info "安装依赖..."
npm ci

# 代码检查
log_info "运行代码检查..."
npm run lint:check

# 类型检查
log_info "运行类型检查..."
npm run type-check

# 运行测试
log_info "运行单元测试..."
npm run test:unit

# 构建项目
log_info "构建项目 - 环境: $ENVIRONMENT"
if [ "$ENVIRONMENT" = "development" ]; then
    npm run build -- --mode development
elif [ "$ENVIRONMENT" = "staging" ]; then
    npm run build -- --mode staging
else
    npm run build
fi

# 检查构建结果
if [ -d "dist" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    log_success "构建完成！构建文件大小: $DIST_SIZE"
    
    # 显示构建文件列表
    log_info "构建文件列表:"
    ls -la dist/
else
    log_error "构建失败：dist 目录不存在"
    exit 1
fi

log_success "医学影像查看器构建完成！"
