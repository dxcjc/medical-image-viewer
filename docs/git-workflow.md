# Git 工作流程指南

本文档描述了医学影像处理系统项目的 Git 工作流程和最佳实践。

## 🌳 分支策略

我们采用 **Git Flow** 工作流程，包含以下分支类型：

### 主要分支

- **`main`** - 生产分支
  - 包含稳定的、可发布的代码
  - 只能通过 Pull Request 合并
  - 受保护，不允许直接推送

- **`develop`** - 开发分支
  - 包含最新的开发代码
  - 所有功能分支的合并目标
  - 定期合并到 main 分支进行发布

### 辅助分支

- **`feature/*`** - 功能分支
  - 从 develop 分支创建
  - 用于开发新功能
  - 完成后合并回 develop 分支
  - 命名规范：`feature/功能描述`

- **`hotfix/*`** - 热修复分支
  - 从 main 分支创建
  - 用于紧急修复生产问题
  - 同时合并到 main 和 develop 分支
  - 命名规范：`hotfix/问题描述`

- **`release/*`** - 发布分支
  - 从 develop 分支创建
  - 用于准备新版本发布
  - 只允许 bug 修复和版本号更新
  - 命名规范：`release/版本号`

## 🔄 工作流程

### 1. 开发新功能

```bash
# 1. 切换到 develop 分支并更新
git checkout develop
git pull origin develop

# 2. 创建功能分支
git checkout -b feature/dicom-viewer

# 3. 开发功能并提交
git add .
git commit -m "feat(viewer): 添加 DICOM 文件查看功能"

# 4. 推送到远程
git push origin feature/dicom-viewer

# 5. 创建 Pull Request 到 develop 分支
```

### 2. 修复 Bug

```bash
# 1. 从相应分支创建修复分支
git checkout develop  # 或 main（如果是热修复）
git checkout -b fix/image-loading-error

# 2. 修复问题并提交
git add .
git commit -m "fix(viewer): 修复图像加载失败问题"

# 3. 推送并创建 Pull Request
git push origin fix/image-loading-error
```

### 3. 发布新版本

```bash
# 1. 从 develop 创建发布分支
git checkout develop
git checkout -b release/v1.1.0

# 2. 更新版本号和发布说明
# 编辑 package.json 中的版本号
# 更新 CHANGELOG.md

# 3. 提交版本更新
git add .
git commit -m "chore(release): 准备 v1.1.0 发布"

# 4. 合并到 main 分支
git checkout main
git merge --no-ff release/v1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0"

# 5. 合并回 develop 分支
git checkout develop
git merge --no-ff release/v1.1.0

# 6. 删除发布分支
git branch -d release/v1.1.0
```

## 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交格式

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 类型说明

- **feat**: 新功能
- **fix**: 修复 bug
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动
- **perf**: 性能优化
- **ci**: CI/CD 相关

### 作用域（可选）

- **viewer**: 图像查看器
- **tools**: 工具栏
- **store**: 状态管理
- **router**: 路由
- **api**: API 接口
- **ui**: 用户界面

### 示例

```bash
feat(viewer): 添加 DICOM 文件拖拽上传功能
fix(tools): 修复缩放工具计算错误
docs(readme): 更新安装说明
style(components): 统一组件代码格式
refactor(store): 重构图像状态管理逻辑
test(viewer): 添加图像加载单元测试
chore(deps): 更新依赖包版本
```

## 🔒 分支保护规则

### main 分支保护

- 禁止直接推送
- 要求 Pull Request 审查
- 要求状态检查通过
- 要求分支为最新状态

### develop 分支保护

- 禁止直接推送
- 要求 Pull Request 审查
- 要求状态检查通过

## 🚀 自动化流程

### CI/CD 触发条件

- **推送到 main 分支**: 触发生产部署
- **推送到 develop 分支**: 触发开发环境部署
- **创建 Pull Request**: 触发测试和代码检查
- **创建 Tag**: 触发版本发布

### 状态检查

- 代码格式检查（ESLint + Prettier）
- 类型检查（TypeScript）
- 单元测试
- 端到端测试
- 构建验证

## 📋 最佳实践

1. **保持提交原子性**: 每个提交只包含一个逻辑变更
2. **编写清晰的提交信息**: 遵循提交规范
3. **及时同步**: 定期从上游分支拉取更新
4. **代码审查**: 所有代码变更都需要经过审查
5. **测试覆盖**: 新功能必须包含相应的测试
6. **文档更新**: 重要变更需要更新相关文档

## 🛠️ 常用命令

```bash
# 查看分支状态
git branch -a

# 查看提交历史
git log --oneline --graph

# 同步远程分支
git fetch origin

# 清理已合并的分支
git branch --merged | grep -v main | xargs git branch -d

# 查看文件变更
git diff

# 暂存部分变更
git add -p

# 修改最后一次提交
git commit --amend
```
