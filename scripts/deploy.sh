#!/bin/bash

# 医学影像查看器部署脚本
# 用法: ./scripts/deploy.sh [目标] [环境]
# 目标: github-pages, server (默认: github-pages)
# 环境: staging, production (默认: production)

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

# 获取参数
TARGET=${1:-github-pages}
ENVIRONMENT=${2:-production}
PROJECT_DIR="medical-image-viewer"

log_info "开始部署医学影像查看器"
log_info "目标: $TARGET"
log_info "环境: $ENVIRONMENT"

# 检查是否在正确的分支
CURRENT_BRANCH=$(git branch --show-current)
if [ "$ENVIRONMENT" = "production" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    log_error "生产环境部署必须在 main 分支进行"
    log_info "当前分支: $CURRENT_BRANCH"
    exit 1
fi

# 检查工作目录是否干净
if [ -n "$(git status --porcelain)" ]; then
    log_error "工作目录不干净，请先提交或暂存更改"
    git status --short
    exit 1
fi

# 构建项目
log_info "构建项目..."
./scripts/build.sh "$ENVIRONMENT"

# 根据目标进行部署
case $TARGET in
    "github-pages")
        log_info "部署到 GitHub Pages..."
        
        # 检查是否有 gh-pages 分支
        if ! git show-ref --verify --quiet refs/heads/gh-pages; then
            log_info "创建 gh-pages 分支..."
            git checkout --orphan gh-pages
            git rm -rf .
            git commit --allow-empty -m "Initial gh-pages commit"
            git checkout "$CURRENT_BRANCH"
        fi
        
        # 切换到 gh-pages 分支
        git checkout gh-pages
        
        # 清理旧文件
        git rm -rf . 2>/dev/null || true
        
        # 复制构建文件
        cp -r "$PROJECT_DIR/dist/"* .
        
        # 添加 .nojekyll 文件
        touch .nojekyll
        
        # 提交更改
        git add .
        git commit -m "Deploy $ENVIRONMENT build - $(date)"
        
        # 推送到远程
        git push origin gh-pages
        
        # 切换回原分支
        git checkout "$CURRENT_BRANCH"
        
        log_success "成功部署到 GitHub Pages！"
        ;;
        
    "server")
        log_info "部署到服务器..."
        
        # 这里可以添加服务器部署逻辑
        # 例如：rsync, scp, docker 等
        
        log_warning "服务器部署功能待实现"
        ;;
        
    *)
        log_error "未知的部署目标: $TARGET"
        log_info "支持的目标: github-pages, server"
        exit 1
        ;;
esac

log_success "部署完成！"
