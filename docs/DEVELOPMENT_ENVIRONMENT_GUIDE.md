# KD Family 开发环境标准化指南

## 📋 概述

本文档定义了KD Family项目的标准化开发环境配置，确保所有开发者使用一致的工具链和配置，提高开发效率和代码质量。

## 🛠️ 开发工具链

### 必需工具
- **Node.js**: v18.x LTS
- **npm**: v9.x+
- **Docker**: v24.x+
- **Docker Compose**: v2.x+
- **Git**: v2.x+

### 推荐IDE
- **主要**: Visual Studio Code
- **备选**: WebStorm, Vim/Neovim

## 🐳 Docker开发环境

### 环境配置文件
```bash
# 复制环境配置模板
cp .env.local .env

# 编辑配置文件
nano .env
```

### 标准化容器配置
```yaml
# docker-compose.local.yml - 本地开发环境
services:
  app:
    container_name: kdfamily-local-app
    ports:
      - "3000:3000"    # 应用端口
      - "9229:9229"    # 调试端口
    volumes:
      - .:/app:delegated  # 热重载
      - kdfamily-local-app-node-modules:/app/node_modules
    environment:
      NODE_ENV: development
      DEBUG: kdfamily:*
```

### 容器命名规范
```bash
# 格式: kdfamily-local-{service}
kdfamily-local-app      # 应用容器
kdfamily-local-database # 数据库容器
kdfamily-local-cache    # Redis缓存容器
```

### 端口映射标准
| 服务 | 容器端口 | 宿主端口 | 用途 |
|------|----------|----------|------|
| 应用 | 3000 | 3000 | Web服务 |
| 调试 | 9229 | 9229 | Node.js调试 |
| MySQL | 3306 | 3307 | 数据库 |
| Redis | 6379 | 6379 | 缓存 |
| phpMyAdmin | 80 | 8080 | 数据库管理 |
| Adminer | 8080 | 8081 | 轻量数据库管理 |

## 🔧 VS Code 配置

### 必需扩展
```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode-remote.remote-containers",
    "ms-azuretools.vscode-docker"
  ]
}
```

### 工作区设置
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["server"],
  "files.exclude": {
    "**/node_modules": true,
    "**/coverage": true,
    "**/logs": true,
    "**/uploads": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/coverage": true
  }
}
```

### 调试配置
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Attach to Node",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app",
      "skipFiles": ["<node_internals>/**"],
      "restart": true
    }
  ]
}
```

## 📦 包管理配置

### package.json 脚本
```json
{
  "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js",
    "dev:debug": "nodemon --inspect=0.0.0.0:9229 server/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint server/ --ext .js",
    "lint:fix": "eslint server/ --ext .js --fix",
    "docker:dev": "docker-compose -f docker-compose.local.yml up -d",
    "docker:down": "docker-compose -f docker-compose.local.yml down"
  }
}
```

### 依赖管理
```bash
# 安装生产依赖
npm install --save package-name

# 安装开发依赖
npm install --save-dev package-name

# 更新依赖
npm update

# 审计安全漏洞
npm audit
npm audit fix
```

## 🧪 测试环境配置

### Jest 配置
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  setupFiles: ['<rootDir>/test/env.js']
};
```

### 测试数据库配置
```bash
# 启动测试数据库
docker-compose -f docker-compose.dev.yml --profile testing up -d

# 运行测试
npm test

# 生成覆盖率报告
npm run test:coverage
```

## 🔍 代码质量工具

### ESLint 配置
```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: ['standard'],
  rules: {
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  }
};
```

### 代码格式化
```bash
# 检查代码风格
npm run lint

# 自动修复
npm run lint:fix
```

## 🌍 环境变量管理

### 环境配置层级
```
.env.local      # 本地开发环境（不提交到Git）
.env.example    # 环境变量模板（提交到Git）
.env.test       # 测试环境配置
.env.production # 生产环境配置
```

### 关键环境变量
```bash
# 应用配置
NODE_ENV=development
PORT=3000
DEBUG=kdfamily:*

# 数据库配置
DB_TYPE=mysql
DB_HOST=database
DB_PORT=3306
DB_NAME=kdfamily_dev
DB_USER=kdfamily_user
DB_PASSWORD=kdfamily_pass_2024

# 安全配置
JWT_SECRET=your_jwt_secret_here
BCRYPT_ROUNDS=10

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH=./uploads
```

## 🚀 开发工作流

### 1. 环境初始化
```bash
# 克隆项目
git clone https://github.com/kop0311/KD_family.git
cd KD_family

# 安装依赖
npm install

# 配置环境变量
cp .env.local .env

# 启动开发环境
npm run docker:dev
```

### 2. 日常开发流程
```bash
# 启动开发服务器
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint

# 提交代码
git add .
git commit -m "feat(scope): description"
git push origin feature-branch
```

### 3. 调试流程
```bash
# 启动调试模式
npm run dev:debug

# 在VS Code中附加调试器
# F5 或 Run > Start Debugging
```

## 📊 性能监控

### 开发环境监控
```bash
# 启用性能监控
DEBUG=kdfamily:* npm run dev

# 查看日志
docker logs -f kdfamily-local-app

# 监控资源使用
docker stats kdfamily-local-app
```

### 健康检查
```bash
# 检查应用状态
curl http://localhost:3000/api/health

# 检查数据库连接
curl http://localhost:3000/api/health/db
```

## 🔧 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 查看端口占用
lsof -i :3000
netstat -tulpn | grep :3000

# 停止冲突进程
kill -9 <PID>
```

#### 2. Docker 容器问题
```bash
# 重启容器
docker restart kdfamily-local-app

# 查看容器日志
docker logs kdfamily-local-app

# 进入容器调试
docker exec -it kdfamily-local-app sh
```

#### 3. 数据库连接问题
```bash
# 检查数据库状态
docker exec -it kdfamily-local-database mysql -u root -p

# 重置数据库
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up -d
```

## 📚 相关文档

- [Git管理策略](./GIT_MANAGEMENT_GUIDE.md)
- [Docker部署指南](../DOCKER_DEPLOYMENT_GUIDE.md)
- [API文档](./api/api-specification.md)
- [测试指南](./testing/user-testing-guide.md)

---

**最后更新**: 2025-07-20  
**维护者**: KD Family 开发团队  
**版本**: v1.0.0
