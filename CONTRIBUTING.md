# 贡献指南

感谢您对医学影像处理系统项目的关注！本文档将指导您如何参与项目开发。

## 🌟 开发流程

### 分支策略

我们采用 Git Flow 工作流程：

- `main` - 主分支，包含稳定的生产代码
- `develop` - 开发分支，包含最新的开发代码
- `feature/*` - 功能分支，用于开发新功能
- `hotfix/*` - 热修复分支，用于紧急修复
- `release/*` - 发布分支，用于准备新版本发布

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### 类型说明

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

#### 示例

```
feat(viewer): 添加 DICOM 文件拖拽上传功能

- 支持多文件同时上传
- 添加上传进度显示
- 增加文件格式验证

Closes #123
```

## 🔧 开发环境设置

1. Fork 项目到您的 GitHub 账户
2. 克隆您的 fork 到本地
3. 安装依赖：`cd medical-image-viewer && npm install`
4. 创建功能分支：`git checkout -b feature/your-feature-name`
5. 进行开发
6. 提交更改：`git commit -m "feat: your feature description"`
7. 推送到您的 fork：`git push origin feature/your-feature-name`
8. 创建 Pull Request

## 📝 代码规范

- 遵循 ESLint 和 Prettier 配置
- 使用 TypeScript 进行类型检查
- 编写单元测试覆盖新功能
- 更新相关文档

## 🧪 测试

在提交代码前，请确保：

```bash
# 运行代码检查
npm run lint

# 运行类型检查
npm run type-check

# 运行单元测试
npm run test:unit

# 运行端到端测试
npm run test:e2e
```

## 📋 Pull Request 检查清单

- [ ] 代码遵循项目规范
- [ ] 包含必要的测试
- [ ] 文档已更新
- [ ] 提交信息符合规范
- [ ] 所有测试通过
- [ ] 没有合并冲突

## 🐛 报告问题

请使用 GitHub Issues 报告问题，并包含：

- 问题描述
- 重现步骤
- 期望行为
- 实际行为
- 环境信息（浏览器、操作系统等）
- 相关截图或日志

## 💡 功能建议

欢迎提出新功能建议！请在 Issues 中详细描述：

- 功能描述
- 使用场景
- 预期收益
- 实现建议（可选）
