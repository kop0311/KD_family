# KD Family 部署检查清单

## 🚀 技术升级后部署准备

**升级版本**: 2025-07-21  
**Node.js**: v22.17.1  
**主要升级**: ESLint 9.x, Jest 30.x, Playwright 1.49.1

## ✅ 部署前检查清单

### 1. 代码质量检查

```bash
# 运行代码检查
npm run lint

# 修复可自动修复的问题
npm run lint:fix

# 确保没有严重的ESLint错误
```

**状态**: ⚠️ 需要修复剩余的23个ESLint问题

### 2. 测试验证

```bash
# 运行所有测试
npm run test:all

# 检查测试覆盖率
npm run test:coverage

# 运行端到端测试
npm run test:e2e
```

**状态**: ⚠️ 需要先配置数据库环境

### 3. 依赖安全检查

```bash
# 检查安全漏洞
npm audit

# 修复安全问题
npm audit fix

# 检查过时依赖
npm outdated
```

**状态**: ✅ 主要依赖已升级到最新版本

### 4. 环境配置验证

```bash
# 检查环境变量
node -e "require('dotenv').config(); console.log('Environment loaded successfully');"

# 验证数据库连接
npm run db:test

# 检查Redis连接（如果使用）
npm run redis:test
```

**状态**: ⚠️ 需要验证生产环境配置

## 🔧 生产环境配置

### 1. 环境变量设置

```bash
# 生产环境必需的环境变量
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_PORT=3306
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=kdfamily_production
JWT_SECRET=your-super-secure-jwt-secret
JWT_EXPIRES_IN=7d
REDIS_URL=redis://your-redis-host:6379
```

### 2. 数据库准备

```sql
-- 创建生产数据库
CREATE DATABASE kdfamily_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建数据库用户
CREATE USER 'kdfamily_prod'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON kdfamily_production.* TO 'kdfamily_prod'@'%';
FLUSH PRIVILEGES;
```

### 3. 服务器配置

```bash
# 安装PM2进程管理器
npm install -g pm2

# 创建PM2配置文件
# ecosystem.config.js
```

### 4. 反向代理配置 (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 性能优化检查

### 1. 应用性能

```bash
# 检查内存使用
node --max-old-space-size=4096 server.js

# 启用生产模式优化
NODE_ENV=production npm start

# 监控应用性能
npm install -g clinic
clinic doctor -- node server.js
```

### 2. 数据库优化

```sql
-- 检查慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- 优化表索引
ANALYZE TABLE users, tasks, points_history;

-- 检查表状态
SHOW TABLE STATUS;
```

### 3. 缓存配置

```javascript
// Redis缓存配置
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis服务器拒绝连接');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('重试时间已用尽');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});
```

## 🔒 安全配置检查

### 1. HTTPS配置

```bash
# 安装SSL证书
sudo certbot --nginx -d your-domain.com

# 配置HTTPS重定向
# 在Nginx配置中添加SSL配置
```

### 2. 安全头配置

```javascript
// 在app.js中确保Helmet配置正确
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3. 输入验证

```javascript
// 确保所有API端点都有适当的验证
const { body, validationResult } = require('express-validator');

app.post('/api/users', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // 处理请求
});
```

## 📈 监控和日志

### 1. 应用监控

```javascript
// 添加健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});
```

### 2. 日志配置

```javascript
// Winston日志配置已升级
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 3. 错误追踪

```bash
# 安装错误追踪服务（可选）
npm install @sentry/node

# 配置Sentry（如果使用）
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
```

## 🚀 部署步骤

### 1. 准备部署

```bash
# 1. 克隆代码到生产服务器
git clone https://github.com/kop0311/KD_family.git
cd KD_family

# 2. 安装生产依赖
npm ci --only=production

# 3. 设置环境变量
cp .env.example .env.production
# 编辑 .env.production 文件

# 4. 运行数据库迁移
npm run migrate:production
```

### 2. 启动应用

```bash
# 使用PM2启动
pm2 start ecosystem.config.js --env production

# 或直接启动
NODE_ENV=production npm start
```

### 3. 验证部署

```bash
# 检查应用状态
curl http://localhost:3000/health

# 检查PM2状态
pm2 status

# 查看日志
pm2 logs
```

## 🔄 部署后验证

### 1. 功能测试

- [ ] 用户注册/登录功能
- [ ] 任务创建和分配
- [ ] 积分系统运行
- [ ] 文件上传功能
- [ ] 数据库连接正常

### 2. 性能测试

- [ ] 响应时间 < 500ms
- [ ] 内存使用稳定
- [ ] CPU使用率正常
- [ ] 数据库查询优化

### 3. 安全测试

- [ ] HTTPS正常工作
- [ ] 安全头配置正确
- [ ] 输入验证有效
- [ ] 认证授权正常

## 📞 紧急联系

如果部署过程中遇到问题：

1. **检查日志**: `pm2 logs` 或 `tail -f logs/error.log`
2. **回滚版本**: `pm2 reload ecosystem.config.js --env previous`
3. **数据库备份**: 确保有最新的数据库备份
4. **监控告警**: 设置适当的监控和告警机制

## 📋 部署完成检查

- [ ] 应用正常启动
- [ ] 数据库连接成功
- [ ] 所有API端点响应正常
- [ ] 前端页面加载正常
- [ ] 用户认证功能正常
- [ ] 文件上传功能正常
- [ ] 日志记录正常
- [ ] 监控系统正常
- [ ] 备份策略已实施
- [ ] SSL证书有效

**部署状态**: ⏳ 等待执行  
**预计完成时间**: 2-4小时  
**风险等级**: 中等（主要是依赖升级带来的兼容性风险）
