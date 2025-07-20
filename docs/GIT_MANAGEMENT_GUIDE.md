# KD Family Git 管理策略指南

## 📋 概述

本文档为KD Family项目定制的Git管理策略，基于项目的技术架构和开发特点，提供完整的版本控制、协作流程和发布管理指南。

## 🏗️ 项目架构特点

### 技术栈分析
- **后端**: Node.js + Express + MySQL/SQLite
- **前端**: 原生HTML/CSS/JavaScript (无构建步骤)
- **部署**: Docker + docker-compose
- **测试**: Jest + Supertest (80%+ 覆盖率)
- **代码质量**: ESLint + 自定义规则

### 项目规模
- **代码行数**: 41,819行
- **文件数量**: 111个文件
- **模块结构**: 清晰的MVC架构
- **开发者**: 单人/小团队开发

## 🌳 Git分支策略

### 主分支结构
```
main (生产分支)
├── develop (开发主分支)
├── feature/* (功能分支)
├── hotfix/* (热修复分支)
└── release/* (发布分支)
```

### 分支命名规范

#### 1. 功能分支 (Feature Branches)
```bash
feature/auth-system-enhancement
feature/avatar-upload-optimization
feature/task-management-ui
feature/points-calculation-logic
```

#### 2. 修复分支 (Bugfix/Hotfix Branches)
```bash
hotfix/security-jwt-validation
hotfix/database-connection-pool
bugfix/avatar-upload-error
bugfix/points-calculation-bug
```

#### 3. 发布分支 (Release Branches)
```bash
release/v1.1.0
release/v1.2.0-beta
```

#### 4. 实验分支 (Experimental Branches)
```bash
experiment/websocket-integration
experiment/redis-caching
experiment/graphql-api
```

## 📝 提交信息规范

### 提交类型 (Commit Types)
```
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式化
refactor: 代码重构
test:     测试相关
chore:    构建/工具链更新
perf:     性能优化
security: 安全修复
```

### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### 提交信息示例
```bash
feat(auth): implement JWT token refresh mechanism

- Add refresh token endpoint
- Update authentication middleware
- Add token expiration handling
- Update tests for new auth flow

Closes #123
```

```bash
fix(avatar): resolve DiceBear API integration issue

- Fix avatar URL generation
- Handle API timeout errors
- Add fallback avatar mechanism
- Update error handling in frontend

Fixes #456
```

## 🔄 工作流程

### 1. 功能开发流程
```bash
# 1. 从develop分支创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/new-feature-name

# 2. 开发过程中定期提交
git add .
git commit -m "feat(scope): implement feature description"

# 3. 推送到远程仓库
git push origin feature/new-feature-name

# 4. 创建Pull Request到develop分支
# 5. 代码审查通过后合并
# 6. 删除功能分支
git branch -d feature/new-feature-name
```

### 2. 热修复流程
```bash
# 1. 从main分支创建热修复分支
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 2. 修复问题并测试
git add .
git commit -m "fix(critical): resolve security vulnerability"

# 3. 合并到main和develop
git checkout main
git merge hotfix/critical-bug-fix
git push origin main

git checkout develop
git merge hotfix/critical-bug-fix
git push origin develop

# 4. 创建标签
git tag -a v1.0.1 -m "Hotfix release v1.0.1"
git push origin v1.0.1
```

### 3. 发布流程
```bash
# 1. 从develop创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v1.1.0

# 2. 更新版本号和文档
# 编辑 package.json, README.md 等

# 3. 最终测试和修复
git add .
git commit -m "chore(release): prepare v1.1.0 release"

# 4. 合并到main
git checkout main
git merge release/v1.1.0
git push origin main

# 5. 创建标签
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0

# 6. 合并回develop
git checkout develop
git merge release/v1.1.0
git push origin develop
```

## 🏷️ 版本标签策略

### 语义化版本控制 (SemVer)
```
v<major>.<minor>.<patch>[-<pre-release>]

例如:
v1.0.0      - 正式版本
v1.1.0      - 新功能版本
v1.0.1      - 修复版本
v2.0.0-beta - 预发布版本
```

### 标签命名规范
```bash
# 正式发布
git tag -a v1.0.0 -m "Initial release"

# 预发布
git tag -a v1.1.0-beta.1 -m "Beta release for v1.1.0"

# 热修复
git tag -a v1.0.1 -m "Hotfix: security vulnerability"
```

## 🔍 代码审查流程

### Pull Request 模板
```markdown
## 变更描述
简要描述本次变更的内容和目的

## 变更类型
- [ ] 新功能
- [ ] Bug修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 安全修复

## 测试情况
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成
- [ ] 性能测试通过

## 影响范围
- [ ] 前端界面
- [ ] 后端API
- [ ] 数据库结构
- [ ] 配置文件
- [ ] 文档

## 检查清单
- [ ] 代码符合ESLint规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 没有破坏现有功能
```

### 审查要点
1. **代码质量**: ESLint规则遵循
2. **测试覆盖**: 新代码有对应测试
3. **安全性**: 输入验证、权限检查
4. **性能**: 数据库查询优化
5. **文档**: API文档和注释更新

## 🚀 持续集成/持续部署

### GitHub Actions 工作流
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run linting
        run: npm run lint
      - name: Run tests
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 📊 Git工作流监控

### 关键指标
- **提交频率**: 每日提交数量
- **分支生命周期**: 功能分支存活时间
- **代码审查时间**: PR从创建到合并的时间
- **测试覆盖率**: 代码覆盖率趋势
- **发布频率**: 版本发布间隔

### 工具推荐
- **Git可视化**: GitKraken, SourceTree
- **代码审查**: GitHub PR, GitLab MR
- **CI/CD**: GitHub Actions, GitLab CI
- **监控**: GitHub Insights, GitLab Analytics

## 🛠️ Claude Code 集成工作流

### 开发环境设置
```bash
# 1. 克隆仓库
git clone https://github.com/kop0311/KD_family.git
cd KD_family

# 2. 安装依赖
npm install

# 3. 设置环境变量
cp .env.example .env

# 4. 启动开发环境
npm run dev
```

### Claude Code 最佳实践
1. **代码分析**: 使用Claude分析代码结构和依赖
2. **重构建议**: 获取代码优化和重构建议
3. **测试生成**: 自动生成单元测试和集成测试
4. **文档更新**: 自动更新API文档和代码注释
5. **安全审查**: 识别潜在的安全漏洞

## 📚 相关文档

- [项目架构文档](./CLAUDE.md)
- [API规范文档](./api/api-specification.md)
- [部署指南](../DOCKER_DEPLOYMENT_GUIDE.md)
- [测试指南](./testing/user-testing-guide.md)
- [安全指南](./troubleshooting/container-stability-fix.md)

---

**最后更新**: 2025-07-20  
**维护者**: KD Family 开发团队  
**版本**: v1.0.0
