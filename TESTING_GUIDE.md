# KD Family 测试指南

## 🎯 测试概览

本项目现在包含三种类型的测试：
- **单元测试** (Jest) - 测试单个函数和模块
- **集成测试** (Jest + Supertest) - 测试API端点和数据库交互
- **端到端测试** (Playwright) - 测试完整的用户流程

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 启动数据库服务
docker-compose -f docker-compose.dev.yml up -d postgres

# 运行数据库迁移
npm run migrate:test
```

### 2. 运行测试

```bash
# 运行所有Jest测试（单元 + 集成）
npm test

# 运行端到端测试
npm run test:e2e

# 运行所有测试
npm run test:all
```

## 📋 详细测试命令

### Jest 测试命令

```bash
# 基本测试
npm test                    # 运行所有Jest测试
npm run test:watch         # 监视模式运行测试
npm run test:coverage      # 生成覆盖率报告
npm run test:integration   # 只运行集成测试

# 运行特定测试文件
npm test auth.test.js      # 运行认证测试
npm test tasks.test.js     # 运行任务测试
npm test users.test.js     # 运行用户测试
```

### Playwright 测试命令

```bash
# 基本端到端测试
npm run test:e2e           # 运行所有E2E测试
npm run test:e2e:ui        # 带UI界面运行测试
npm run test:e2e:headed    # 有头模式运行测试

# 运行特定测试文件
npx playwright test auth.spec.js      # 运行认证E2E测试
npx playwright test tasks.spec.js     # 运行任务E2E测试
npx playwright test dashboard.spec.js # 运行仪表板E2E测试

# 调试测试
npx playwright test --debug           # 调试模式
npx playwright test --trace on        # 启用追踪
```

## 🧪 测试文件结构

```
KD_Family/
├── test/                  # Jest 单元和集成测试
│   ├── auth.test.js      # 认证API测试
│   ├── tasks.test.js     # 任务管理测试
│   ├── users.test.js     # 用户管理测试
│   ├── points.test.js    # 积分系统测试
│   ├── integration.test.js # 系统集成测试
│   ├── improvements.test.js # 功能改进测试
│   ├── setup.js          # Jest 测试设置
│   └── env.js            # 测试环境变量
│
├── tests/e2e/            # Playwright 端到端测试
│   ├── auth.spec.js      # 认证流程E2E测试
│   ├── tasks.spec.js     # 任务管理E2E测试
│   ├── dashboard.spec.js # 仪表板E2E测试
│   ├── global-setup.js  # E2E全局设置
│   └── global-teardown.js # E2E全局清理
│
└── test-reports/         # 测试报告输出
    ├── jest-html-reporters/
    ├── playwright-report/
    └── playwright-artifacts/
```

## 🔧 测试配置

### Jest 配置 (jest.config.js)

- **测试环境**: Node.js
- **覆盖率目标**: 80% (语句、分支、函数、行)
- **超时时间**: 30秒
- **报告格式**: HTML + 控制台

### Playwright 配置 (playwright.config.js)

- **支持浏览器**: Chrome, Firefox, Safari, Mobile
- **并行执行**: 是
- **重试次数**: CI环境2次，本地0次
- **超时时间**: 30秒
- **报告格式**: HTML + JSON + JUnit

## 📊 测试覆盖率

### 当前覆盖率目标

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### 查看覆盖率报告

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看HTML报告
open coverage/index.html
```

## 🐛 测试调试

### Jest 调试

```bash
# 调试特定测试
node --inspect-brk node_modules/.bin/jest --runInBand auth.test.js

# 使用VS Code调试
# 在测试文件中设置断点，然后按F5
```

### Playwright 调试

```bash
# 调试模式运行
npx playwright test --debug

# 查看测试追踪
npx playwright show-trace trace.zip

# 生成测试代码
npx playwright codegen localhost:3000
```

## 🚨 常见问题解决

### 1. 数据库连接失败

```bash
# 确保数据库服务运行
docker-compose -f docker-compose.dev.yml up -d postgres

# 检查数据库状态
docker-compose -f docker-compose.dev.yml ps

# 查看数据库日志
docker-compose -f docker-compose.dev.yml logs postgres
```

### 2. 端口冲突

```bash
# 检查端口占用
lsof -i :3000
lsof -i :3307

# 杀死占用进程
kill -9 <PID>
```

### 3. Playwright 浏览器安装

```bash
# 安装浏览器
npx playwright install

# 安装系统依赖
npx playwright install-deps
```

## 📈 测试最佳实践

### 1. 测试命名规范

```javascript
// Jest 测试
describe('用户认证系统', () => {
  test('应该成功登录有效用户', async () => {
    // 测试代码
  });
});

// Playwright 测试
test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // 测试代码
  });
});
```

### 2. 测试数据管理

```javascript
// 使用测试专用数据
const testUser = {
  username: 'test_user_' + Date.now(),
  email: 'test@example.com',
  password: 'testpass123'
};
```

### 3. 异步测试处理

```javascript
// Jest 异步测试
test('异步API调用', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials);
  
  expect(response.status).toBe(200);
});

// Playwright 异步测试
test('页面加载', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
});
```

## 🎯 测试检查清单

### 运行测试前检查

- [ ] 数据库服务已启动
- [ ] 环境变量已配置
- [ ] 依赖包已安装
- [ ] 端口未被占用

### 测试完成后检查

- [ ] 所有测试通过
- [ ] 覆盖率达到目标
- [ ] 无内存泄漏警告
- [ ] 测试报告已生成

## 📞 获取帮助

如果遇到测试问题：

1. 查看测试日志和错误信息
2. 检查数据库连接状态
3. 验证环境配置
4. 查看相关文档：
   - [Jest 文档](https://jestjs.io/docs/getting-started)
   - [Playwright 文档](https://playwright.dev/docs/intro)
   - [Supertest 文档](https://github.com/visionmedia/supertest)
