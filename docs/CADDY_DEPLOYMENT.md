# KD Family Caddy 部署指南

本文档介绍如何使用 Caddy 作为 KD Family 项目的 Web 服务器和反向代理。

## 🚀 快速开始

### 开发环境

```bash
# 启动开发环境
npm run caddy:dev

# 或使用部署脚本
./scripts/deploy-caddy.sh dev
```

访问地址：
- 前端应用: http://localhost:8080
- 管理工具: http://localhost:8081
- API文档: http://localhost:3000/api-docs

### 生产环境

```bash
# 设置域名
export DOMAIN=your-domain.com

# 部署生产环境
npm run caddy:prod

# 或使用部署脚本
./scripts/deploy-caddy.sh prod
```

## 📁 文件结构

```
├── Caddyfile              # 生产环境配置
├── Caddyfile.dev          # 开发环境配置
├── .env.caddy             # 环境变量模板
├── scripts/
│   └── deploy-caddy.sh    # 部署脚本
├── docker-compose.modern.yml  # 生产环境Docker配置
├── docker-compose.dev.yml     # 开发环境Docker配置
└── k8s/
    └── caddy.yaml         # Kubernetes配置
```

## ⚙️ 配置说明

### Caddyfile 主要功能

1. **自动HTTPS**: 自动获取和续期SSL证书
2. **反向代理**: API请求代理到后端服务
3. **静态文件服务**: 前端应用文件服务
4. **安全头部**: 自动添加安全相关HTTP头部
5. **缓存策略**: 静态资源长期缓存，HTML文件不缓存
6. **访问日志**: 结构化日志记录
7. **健康检查**: 后端服务健康检查

### 环境变量配置

复制 `.env.caddy` 为 `.env` 并修改：

```bash
cp .env.caddy .env
```

主要配置项：
- `DOMAIN`: 主域名
- `CADDY_EMAIL`: SSL证书申请邮箱
- `BACKEND_HOST`: 后端服务地址
- `FRONTEND_ROOT`: 前端文件根目录

## 🐳 Docker 部署

### 开发环境

```bash
# 启动基础服务
docker-compose -f docker-compose.dev.yml up -d mysql redis

# 启动Caddy代理
docker-compose -f docker-compose.dev.yml --profile proxy up -d caddy-dev
```

### 生产环境

```bash
# 构建前端
cd frontend && pnpm build && cd ..

# 启动所有服务
docker-compose -f docker-compose.modern.yml up -d
```

## ☸️ Kubernetes 部署

```bash
# 创建命名空间
kubectl apply -f k8s/namespace.yaml

# 部署配置
kubectl apply -f k8s/configmap.yaml

# 部署数据库和缓存
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/redis.yaml

# 部署后端
kubectl apply -f k8s/backend.yaml

# 部署Caddy
kubectl apply -f k8s/caddy.yaml
```

## 🔧 管理命令

### 使用部署脚本

```bash
# 查看帮助
./scripts/deploy-caddy.sh help

# 部署开发环境
./scripts/deploy-caddy.sh dev

# 部署生产环境
./scripts/deploy-caddy.sh prod

# 查看日志
./scripts/deploy-caddy.sh logs caddy

# 健康检查
./scripts/deploy-caddy.sh health

# 重启服务
./scripts/deploy-caddy.sh restart caddy

# 停止服务
./scripts/deploy-caddy.sh stop

# 清理资源
./scripts/deploy-caddy.sh cleanup
```

### 使用npm脚本

```bash
# 开发环境
npm run caddy:dev

# 生产环境
npm run caddy:prod

# 查看日志
npm run caddy:logs

# 健康检查
npm run caddy:health

# 重启服务
npm run caddy:restart
```

## 🔍 监控和日志

### 访问日志

Caddy 会自动记录访问日志，格式为JSON：

```bash
# 查看实时日志
docker-compose logs -f caddy

# 查看特定时间的日志
docker-compose exec caddy tail -f /var/log/caddy/access.log
```

### 健康检查

```bash
# 检查Caddy状态
curl -f http://localhost:8080/health

# 检查后端API
curl -f http://localhost:3000/health

# 使用脚本检查
./scripts/deploy-caddy.sh health
```

### 性能监控

Caddy 支持 Prometheus 指标：

```caddyfile
:80 {
    metrics /metrics
    # ... 其他配置
}
```

## 🛡️ 安全配置

### SSL/TLS

Caddy 自动处理SSL证书：

```caddyfile
your-domain.com {
    tls {
        protocols tls1.2 tls1.3
    }
    # ... 其他配置
}
```

### 安全头部

自动添加的安全头部：
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`
- `Referrer-Policy`
- `Content-Security-Policy`

### 基本认证

管理面板可以启用基本认证：

```caddyfile
admin.your-domain.com {
    basicauth {
        admin $2a$14$hashed_password_here
    }
    # ... 其他配置
}
```

## 🚨 故障排除

### 常见问题

1. **SSL证书获取失败**
   ```bash
   # 检查域名DNS解析
   nslookup your-domain.com
   
   # 检查防火墙端口80/443
   sudo ufw status
   ```

2. **后端连接失败**
   ```bash
   # 检查后端服务状态
   docker-compose ps backend
   
   # 检查网络连接
   docker-compose exec caddy ping backend
   ```

3. **静态文件404**
   ```bash
   # 检查前端构建
   ls -la frontend/dist/
   
   # 检查文件权限
   docker-compose exec caddy ls -la /var/www/kdfamily/
   ```

### 调试模式

启用调试日志：

```caddyfile
{
    debug
    log {
        level DEBUG
    }
}
```

### 配置验证

```bash
# 验证Caddyfile语法
docker run --rm -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile
```

## 📈 性能优化

### 缓存策略

```caddyfile
# 静态资源长期缓存
@static {
    path *.js *.css *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2
}
header @static Cache-Control "public, max-age=31536000, immutable"

# HTML文件不缓存
@html {
    path *.html
}
header @html Cache-Control "no-cache, no-store, must-revalidate"
```

### 压缩配置

```caddyfile
encode {
    gzip 6
    zstd
}
```

### HTTP/3支持

```caddyfile
{
    servers {
        protocol {
            experimental_http3
        }
    }
}
```

## 🔄 更新和维护

### 更新Caddy

```bash
# 拉取最新镜像
docker pull caddy:2-alpine

# 重启服务
docker-compose restart caddy
```

### 配置热重载

```bash
# 重载配置（不中断服务）
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### 备份配置

```bash
# 备份Caddy数据
docker run --rm -v caddy_data:/data -v $(pwd):/backup alpine tar czf /backup/caddy-backup.tar.gz /data
```

## 📚 参考资源

- [Caddy 官方文档](https://caddyserver.com/docs/)
- [Caddyfile 语法](https://caddyserver.com/docs/caddyfile)
- [Docker 部署指南](https://caddyserver.com/docs/running#docker-compose)
- [Kubernetes 部署](https://caddyserver.com/docs/running#kubernetes)
