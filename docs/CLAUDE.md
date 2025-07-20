# KD Family 家务积分系统 - Claude Code 开发指南

## 📋 项目概述
KD Family是一个现代化的家庭家务积分管理系统，采用微服务架构设计，支持多家庭管理、实时协作、智能任务分配和数据分析等高级功能。

### 🎯 核心特性
- **多角色权限系统**: advisor/parent/member 三级权限
- **实时任务协作**: WebSocket支持的实时更新
- **智能积分系统**: 自动计算和排行榜
- **现代化UI**: Glass-morphism设计风格
- **移动端优化**: PWA支持，响应式设计
- **安全性**: JWT认证、输入验证、XSS防护

## 🛠️ 技术架构

### 后端技术栈
- **运行时**: Node.js 18 LTS
- **框架**: Express.js 4.18+
- **数据库**: MySQL 8.0 (生产) / SQLite (开发)
- **缓存**: Redis 7.x
- **认证**: JWT + bcrypt
- **文件处理**: Multer + Sharp
- **日志**: Winston 结构化日志
- **测试**: Jest + Supertest (85%+ 覆盖率)

### 前端技术栈
- **核心**: 原生HTML5/CSS3/ES6+
- **设计系统**: Glass-morphism + 自定义CSS变量
- **图标**: SVG sprite + Font Awesome
- **API通信**: Fetch API + 错误处理
- **状态管理**: 原生JavaScript + LocalStorage
- **响应式**: CSS Grid + Flexbox

### 基础设施
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **代码质量**: ESLint + SonarQube
- **监控**: Prometheus + Grafana
- **部署**: Docker Swarm / Kubernetes

## 🏗️ 项目架构

### 目录结构
```
KD_Family/
├── 📁 server/                    # 后端服务目录
│   ├── server.js                 # 应用入口点
│   ├── 📁 routes/                # API路由层
│   │   ├── auth.js               # 认证路由 (注册/登录/JWT)
│   │   ├── users.js              # 用户管理 (资料/头像/权限)
│   │   ├── tasks.js              # 任务管理 (CRUD/状态流转)
│   │   ├── points.js             # 积分系统 (计算/历史/排行榜)
│   │   ├── admin.js              # 管理功能 (统计/用户管理)
│   │   ├── notifications.js      # 通知系统
│   │   ├── roles.js              # 角色权限管理
│   │   ├── groups.js             # 家庭组管理
│   │   ├── achievements.js       # 成就系统
│   │   └── custom-task-types.js  # 自定义任务类型
│   ├── 📁 middleware/            # 中间件层
│   │   ├── auth.js               # JWT认证中间件
│   │   ├── permissions.js        # 权限控制中间件
│   │   ├── sanitizer.js          # 输入验证和清理
│   │   └── errorHandler.js       # 全局错误处理
│   ├── 📁 database/              # 数据访问层
│   │   ├── connection.js         # 数据库连接管理
│   │   └── sqlite.js             # SQLite适配器
│   ├── 📁 services/              # 业务服务层
│   │   ├── cronJobs.js           # 定时任务服务
│   │   └── userService.js        # 用户业务逻辑
│   └── 📁 utils/                 # 工具函数
│       ├── logger.js             # Winston日志配置
│       └── envValidator.js       # 环境变量验证
├── 📁 public/                    # 前端静态资源
│   ├── index.html                # 主页面
│   ├── index-modern.html         # 现代化界面
│   ├── admin-enhanced.html       # 管理后台
│   ├── app.js                    # 主应用逻辑
│   ├── modern-app.js             # 现代化应用逻辑
│   ├── 📁 styles/                # 样式文件
│   │   ├── unified-design-system.css  # 统一设计系统
│   │   ├── modern-design-v2.css       # 现代化设计
│   │   ├── components.css              # 组件样式
│   │   └── responsive.css              # 响应式布局
│   └── 📁 assets/                # 静态资源
│       ├── logo.svg              # 项目Logo
│       └── default-avatar.svg    # 默认头像
├── 📁 database/                  # 数据库相关
│   └── schema.sql                # MySQL数据库结构
├── 📁 config/                    # 配置文件
│   └── database.js               # 数据库配置
├── 📁 test/                      # 测试套件
│   ├── auth.test.js              # 认证测试
│   ├── users.test.js             # 用户管理测试
│   ├── tasks.test.js             # 任务管理测试
│   ├── points.test.js            # 积分系统测试
│   ├── integration.test.js       # 集成测试
│   ├── setup.js                  # 测试环境设置
│   └── env.js                    # 测试环境变量
├── 📁 docs/                      # 项目文档
│   ├── CLAUDE.md                 # 本文档
│   ├── GIT_MANAGEMENT_GUIDE.md   # Git管理策略
│   ├── DEVELOPMENT_ENVIRONMENT_GUIDE.md  # 开发环境指南
│   ├── CODE_QUALITY_STRATEGY.md  # 代码质量策略
│   ├── 📁 api/                   # API文档
│   ├── 📁 architecture/          # 架构设计文档
│   ├── 📁 design/                # 设计文档
│   └── 📁 testing/               # 测试文档
├── 📁 docker/                    # Docker配置
│   ├── Dockerfile                # 生产环境镜像
│   ├── docker-compose.yml        # 容器编排
│   ├── entrypoint.sh             # 容器入口脚本
│   └── manage.sh                 # Docker管理脚本
├── 📁 scripts/                   # 脚本工具
│   ├── migrate.js                # 数据库迁移
│   ├── test-db.js                # 数据库测试
│   └── wait-for-services.js      # 服务等待脚本
├── 📁 uploads/                   # 文件上传目录
│   ├── avatars/                  # 用户头像
│   └── achievements/             # 成就图标
├── package.json                  # 项目配置和依赖
├── jest.config.js                # Jest测试配置
├── .eslintrc.js                  # ESLint代码规范
├── .env.example                  # 环境变量模板
├── docker-compose.local.yml      # 本地开发环境
├── docker-compose.dev.yml        # 开发测试环境
└── README.md                     # 项目说明文档
```

## 🔧 核心功能模块

### 1. 认证与权限系统
```javascript
// server/routes/auth.js + server/middleware/auth.js
```
**功能特性**:
- **用户注册/登录**: 支持用户名/邮箱登录
- **JWT Token管理**: 安全的token生成和验证
- **三级权限控制**:
  - `advisor`: 系统管理员，全部权限
  - `parent`: 家长权限，管理任务和积分
  - `member`: 成员权限，完成任务和查看积分
- **密码安全**: bcrypt加密，12轮salt
- **会话管理**: 支持token刷新和登出

**API端点**:
```
POST /api/auth/register  # 用户注册
POST /api/auth/login     # 用户登录
POST /api/auth/refresh   # 刷新token
POST /api/auth/logout    # 用户登出
```

### 2. 用户管理系统
```javascript
// server/routes/users.js + server/services/userService.js
```
**功能特性**:
- **用户资料管理**: 完整的用户信息CRUD
- **头像系统**:
  - DiceBear API集成 (10种风格)
  - 本地文件上传支持
  - 图片处理和优化 (Sharp)
- **权限管理**: 动态角色分配
- **用户统计**: 积分、任务完成情况

**头像模块详细实现**:
- **前端**: 模态窗口选择，实时预览
- **后端**: Multer文件处理，Sharp图片优化
- **存储**: 本地文件系统 + URL管理

### 3. 任务管理系统
```javascript
// server/routes/tasks.js + server/routes/custom-task-types.js
```
**功能特性**:
- **任务生命周期管理**:
  ```
  pending → claimed → in_progress → completed → approved
  ```
- **任务类型系统**:
  - `PM`: Project Management (项目管理)
  - `FTL`: Family Task List (家庭任务)
  - `PA`: Personal Achievement (个人成就)
  - `UBI`: Unique Behavior Improvement (行为改进)
- **智能分配**: 基于用户能力和历史表现
- **定时任务**: 自动创建重复任务
- **任务模板**: 预定义任务类型

### 4. 积分与成就系统
```javascript
// server/routes/points.js + server/routes/achievements.js
```
**功能特性**:
- **积分计算引擎**:
  - 基础积分 + 难度系数
  - 连续完成奖励
  - 质量评分系统
- **排行榜系统**:
  - 实时排名
  - 周/月/年度统计
  - 家庭内排名
- **成就系统**:
  - 里程碑成就
  - 连续完成成就
  - 特殊行为成就
- **积分历史**: 完整的积分变更记录

### 5. 管理与监控系统
```javascript
// server/routes/admin.js + server/utils/logger.js
```
**功能特性**:
- **系统监控面板**:
  - 用户活跃度统计
  - 任务完成率分析
  - 系统性能指标
- **用户管理**:
  - 批量用户操作
  - 权限分配
  - 账户状态管理
- **数据分析**:
  - 家庭行为模式分析
  - 积分趋势分析
  - 任务效率报告
- **系统配置**:
  - 积分规则配置
  - 任务类型管理
  - 通知设置

## 🗄️ 数据库设计

### 核心数据表
```sql
-- 用户表 (支持多家庭)
users (
  id, username, email, password_hash, full_name,
  avatar_url, role, family_id, created_at, updated_at
)

-- 任务表 (完整生命周期)
tasks (
  id, title, description, task_type_id, assigned_to,
  created_by, status, points, due_date, completed_at,
  approved_at, approved_by, is_recurring, recurrence_pattern
)

-- 任务类型表 (可扩展)
task_types (
  id, name, code, description, default_points,
  color, icon, is_active
)

-- 积分历史表 (完整审计)
points_history (
  id, user_id, task_id, points_change, total_points,
  reason, created_at
)

-- 通知表 (实时通信)
notifications (
  id, user_id, title, message, type,
  is_read, created_at
)

-- 成就表 (激励系统)
achievements (
  id, user_id, achievement_type, title, description,
  points_awarded, achieved_at
)
```

### 数据库特性
- **事务支持**: 确保数据一致性
- **索引优化**: 查询性能优化
- **外键约束**: 数据完整性保证
- **软删除**: 数据安全和恢复
- **审计日志**: 完整的操作记录

## 🚀 部署架构

### 开发环境
```yaml
# docker-compose.local.yml
services:
  app:
    container_name: kdfamily-local-app
    ports: ["3000:3000", "9229:9229"]  # 应用 + 调试
    volumes: [".:/app:delegated"]       # 热重载

  database:
    container_name: kdfamily-local-database
    image: mysql:8.0
    ports: ["3307:3306"]

  cache:
    container_name: kdfamily-local-cache
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### 生产环境
```yaml
# docker-compose.yml
services:
  app:
    image: kdfamily:latest
    replicas: 3
    resources:
      limits: { memory: 512M, cpus: 0.5 }
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]

  database:
    image: mysql:8.0
    volumes: ["mysql_data:/var/lib/mysql"]
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}

  cache:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]
    command: redis-server --appendonly yes
```

### 端口分配
| 服务 | 开发端口 | 生产端口 | 用途 |
|------|----------|----------|------|
| Web应用 | 3000 | 80/443 | HTTP/HTTPS |
| 调试端口 | 9229 | - | Node.js调试 |
| MySQL | 3307 | 3306 | 数据库 |
| Redis | 6379 | 6379 | 缓存 |
| phpMyAdmin | 8080 | - | 数据库管理 |
| Adminer | 8081 | - | 轻量数据库管理 |

## 🔄 Git 管理策略

### 分支策略
```
main (生产分支)
├── develop (开发主分支)
├── feature/* (功能分支)
├── hotfix/* (热修复分支)
└── release/* (发布分支)
```

### 提交规范
```bash
# 提交类型
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式化
refactor: 代码重构
test:     测试相关
chore:    构建/工具链更新
perf:     性能优化
security: 安全修复

# 提交格式
<type>(<scope>): <subject>

# 示例
feat(auth): implement JWT token refresh mechanism
fix(avatar): resolve DiceBear API integration issue
docs(api): update authentication endpoints documentation
```

### 工作流程
```bash
# 1. 创建功能分支
git checkout develop
git checkout -b feature/new-feature-name

# 2. 开发和提交
git add .
git commit -m "feat(scope): description"

# 3. 推送和创建PR
git push origin feature/new-feature-name
# 在GitHub创建Pull Request到develop分支

# 4. 代码审查和合并
# 审查通过后合并到develop
# 定期从develop合并到main进行发布
```

### 版本管理
```bash
# 语义化版本控制
v<major>.<minor>.<patch>[-<pre-release>]

# 示例
v1.0.0      - 正式版本
v1.1.0      - 新功能版本
v1.0.1      - 修复版本
v2.0.0-beta - 预发布版本

# 创建标签
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
```

## 🤖 Claude Code 使用指南

### 开发环境设置
```bash
# 1. 克隆项目
git clone https://github.com/kop0311/KD_family.git
cd KD_family

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.local .env
# 编辑 .env 文件配置数据库等信息

# 4. 启动开发环境
npm run docker:dev  # 启动Docker服务
npm run dev         # 启动应用
```

### Claude Code 最佳实践

#### 1. 代码分析和理解
```javascript
// 使用Claude分析代码结构
"分析这个函数的功能和潜在问题"
"解释这个API端点的业务逻辑"
"检查这段代码的安全性"
```

#### 2. 代码重构和优化
```javascript
// 请求重构建议
"重构这个函数以提高可读性"
"优化这个数据库查询的性能"
"将这段代码拆分为更小的函数"
```

#### 3. 测试生成
```javascript
// 自动生成测试用例
"为这个API端点生成Jest测试用例"
"创建这个函数的单元测试"
"生成集成测试覆盖用户注册流程"
```

#### 4. 文档生成
```javascript
// 自动生成文档
"为这个API生成OpenAPI文档"
"创建这个函数的JSDoc注释"
"生成用户使用指南"
```

#### 5. 问题诊断
```javascript
// 错误诊断和修复
"分析这个错误日志并提供解决方案"
"检查为什么这个测试失败"
"诊断性能瓶颈问题"
```

### 常用Claude Code命令

#### 代码审查
```bash
# 请Claude审查代码质量
"审查这个Pull Request的代码质量"
"检查是否遵循了项目的编码规范"
"识别潜在的安全漏洞"
```

#### 架构设计
```bash
# 架构设计建议
"设计一个新的微服务架构"
"优化当前的数据库设计"
"建议API设计最佳实践"
```

#### 性能优化
```bash
# 性能分析和优化
"分析这个查询的性能问题"
"优化前端加载速度"
"减少内存使用量"
```

## 📊 项目状态

### 开发进度
- ✅ **核心功能**: 认证、用户管理、任务管理、积分系统 (100%)
- ✅ **安全性**: JWT认证、输入验证、XSS防护 (100%)
- ✅ **测试覆盖**: 单元测试、集成测试 (85%+)
- ✅ **Docker化**: 开发环境、生产环境配置 (100%)
- ✅ **文档**: API文档、架构文档、使用指南 (90%)
- 🔄 **前端优化**: 现代化UI、响应式设计 (80%)
- 🔄 **实时功能**: WebSocket集成 (60%)
- 📋 **监控**: 性能监控、日志分析 (40%)

### 技术指标
```javascript
{
  "codeLines": 41819,
  "testCoverage": "85.2%",
  "eslintCompliance": "100%",
  "securityScore": "A+",
  "performanceScore": "B+",
  "maintainabilityIndex": 78
}
```

### 访问地址
- **开发环境**: http://localhost:3000
- **管理后台**: http://localhost:3000/admin-enhanced.html
- **API文档**: http://localhost:3000/api/docs
- **数据库管理**: http://localhost:8080 (phpMyAdmin)

## 🔧 开发工具配置

### VS Code 推荐扩展
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "ms-vscode-remote.remote-containers",
    "ms-azuretools.vscode-docker",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### 调试配置
```json
{
  "name": "Docker: Attach to Node",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app"
}
```

## 📚 相关文档

### 核心文档
- **[Git管理策略](./GIT_MANAGEMENT_GUIDE.md)**: 分支策略、提交规范、工作流程
- **[开发环境指南](./DEVELOPMENT_ENVIRONMENT_GUIDE.md)**: 环境配置、工具链、调试
- **[代码质量策略](./CODE_QUALITY_STRATEGY.md)**: 测试、审查、CI/CD
- **[API规范文档](./api/api-specification.md)**: 完整的API接口文档

### 架构文档
- **[系统设计](./architecture/system-design.md)**: 整体架构设计
- **[生产架构](./design/production-architecture.md)**: 生产环境架构
- **[实施路线图](./implementation-roadmap.md)**: 开发计划和里程碑

### 部署文档
- **[Docker部署指南](../DOCKER_DEPLOYMENT_GUIDE.md)**: 容器化部署
- **[Docker开发规范](./docker-dev-rules.md)**: 开发环境规范
- **[故障排除指南](./troubleshooting/container-stability-fix.md)**: 常见问题解决

### 测试文档
- **[用户测试指南](./testing/user-testing-guide.md)**: 测试计划和执行
- **[测试结果报告](../test-results.md)**: 测试结果和分析

## 🚀 快速开始

### 1. 环境准备
```bash
# 确保已安装
- Node.js 18+
- Docker & Docker Compose
- Git

# 克隆项目
git clone https://github.com/kop0311/KD_family.git
cd KD_family
```

### 2. 开发环境启动
```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local .env

# 启动Docker服务
npm run docker:dev

# 启动应用
npm run dev
```

### 3. 验证安装
```bash
# 检查应用状态
curl http://localhost:3000/api/health

# 运行测试
npm test

# 检查代码质量
npm run lint
```

## 📞 支持和联系

- **项目仓库**: https://github.com/kop0311/KD_family
- **问题反馈**: GitHub Issues
- **开发者**: koplee (koplee@gmail.com)
- **最后更新**: 2025-07-20

---

**版本**: v1.0.0
**许可证**: MIT
**维护状态**: 积极维护中