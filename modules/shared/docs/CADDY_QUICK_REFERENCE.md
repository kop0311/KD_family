# Caddy 快速参考

## 🚀 快速命令

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

## 📁 重要文件

| 文件 | 用途 |
|------|------|
| `Caddyfile` | 生产环境配置 |
| `Caddyfile.dev` | 开发环境配置 |
| `.env.caddy` | 环境变量模板 |
| `scripts/deploy-caddy.sh` | 部署脚本 |

## 🔧 常用配置

### 域名设置
```bash
# 设置主域名
export DOMAIN=your-domain.com

# 设置管理域名
export ADMIN_DOMAIN=admin.your-domain.com
```

### SSL证书
```caddyfile
your-domain.com {
    tls your-email@domain.com
    # 自动获取Let's Encrypt证书
}
```

### 反向代理
```caddyfile
handle /api/* {
    reverse_proxy backend:3000
}
```

### 静态文件
```caddyfile
handle /* {
    try_files {path} /index.html
    root * /var/www/kdfamily
    file_server
}
```

## 🐳 Docker 命令

```bash
# 启动Caddy容器
docker-compose -f docker-compose.modern.yml up -d caddy

# 查看Caddy日志
docker-compose logs -f caddy

# 重载配置
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# 验证配置
docker run --rm -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile
```

## 🔍 故障排除

### 检查服务状态
```bash
# 检查Caddy进程
docker-compose ps caddy

# 检查端口占用
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### 查看详细日志
```bash
# 实时日志
docker-compose logs -f caddy

# 错误日志
docker-compose exec caddy tail -f /var/log/caddy/error.log
```

### 测试连接
```bash
# 测试HTTP
curl -I http://localhost:8080

# 测试HTTPS
curl -I https://your-domain.com

# 测试API
curl http://localhost:8080/api/health
```

## 📊 监控指标

### 健康检查端点
- Frontend: `http://localhost:8080/`
- Backend: `http://localhost:3000/health`
- Database: `docker-compose exec mysql mysqladmin ping`

### 性能指标
```bash
# 响应时间测试
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080

# 并发测试
ab -n 1000 -c 10 http://localhost:8080/
```

## 🛡️ 安全配置

### 基本认证
```caddyfile
basicauth {
    admin $2a$14$hashed_password
}
```

### IP限制
```caddyfile
@admin {
    remote_ip 192.168.1.0/24
}
handle @admin {
    # 管理员访问
}
```

### 速率限制
```caddyfile
rate_limit {
    zone static_ip 10r/s
}
```

## 🔄 维护操作

### 更新Caddy
```bash
# 拉取最新镜像
docker pull caddy:2-alpine

# 重启服务
docker-compose restart caddy
```

### 备份配置
```bash
# 备份Caddyfile
cp Caddyfile Caddyfile.backup.$(date +%Y%m%d)

# 备份Caddy数据
docker run --rm -v caddy_data:/data -v $(pwd):/backup alpine tar czf /backup/caddy-data-backup.tar.gz /data
```

### 恢复配置
```bash
# 恢复Caddyfile
cp Caddyfile.backup.20241220 Caddyfile

# 重载配置
docker-compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## 📈 性能优化

### 启用压缩
```caddyfile
encode {
    gzip 6
    zstd
}
```

### 缓存配置
```caddyfile
@static {
    path *.js *.css *.png *.jpg *.gif *.ico *.svg
}
header @static Cache-Control "public, max-age=31536000"
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

## 🌐 多环境配置

### 开发环境
- 端口: 8080
- HTTPS: 关闭
- 日志: DEBUG级别
- 代理: localhost:5173 (Vite)

### 生产环境
- 端口: 80/443
- HTTPS: 自动
- 日志: INFO级别
- 静态文件: /var/www/kdfamily

### 测试环境
- 端口: 8080
- HTTPS: 自签名证书
- 日志: WARN级别
- 代理: test-backend:3000
