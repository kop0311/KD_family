# KD之家 Docker 部署指南

## 🚀 概述

本指南提供了KD之家家务积分系统的完整Docker部署解决方案，包括本地开发环境的规范化配置、热加载功能以及生产部署选项。

## 📋 部署配置清单

### ✅ 已完成的工作

1. **规范化Docker命名系统**
   - 统一的容器命名：`kdfamily-local-{service}`
   - 明确的卷命名：`kdfamily-local-{service}-{type}`
   - 标准化网络：`kdfamily-local-network`

2. **热加载开发环境**
   - 源代码热重载（delegated卷挂载）
   - Node.js调试端口（9229）
   - LiveReload支持（35729）

3. **完整服务栈**
   - MySQL 8.0 数据库
   - Redis 7 缓存
   - Node.js 18 应用
   - phpMyAdmin 数据库管理
   - Adminer 轻量级数据库管理
   - RedisInsight Redis管理

4. **自动化脚本**
   - Docker管理脚本（`docker/manage.sh`）
   - 健康检查和监控
   - 备份和恢复功能

## 🛠️ 文件结构

```
KD_Family/
├── docker-compose.local.yml      # 本地开发环境（推荐）
├── docker-compose.dev.yml        # 原有开发配置
├── docker-compose.yml           # 生产环境配置
├── Dockerfile.local             # 本地开发镜像
├── Dockerfile.dev              # 开发镜像
├── Dockerfile                  # 生产镜像
├── .env.local                  # 本地环境模板
├── .env                       # 当前环境配置
└── docker/
    ├── manage.sh              # Docker管理脚本
    └── entrypoint.sh         # 容器启动脚本
```

## 🚀 快速开始

### 方法1：本地开发环境（推荐）

```bash
# 1. 复制环境配置
cp .env.local .env

# 2. 启动所有服务
./docker/manage.sh start

# 3. 检查服务状态
./docker/manage.sh health

# 4. 查看日志
./docker/manage.sh logs
```

### 方法2：SQLite本地运行（最简单）

```bash
# 直接使用SQLite启动（无需Docker）
DB_TYPE=sqlite npm start
```

### 方法3：原有开发环境

```bash
# 使用原有配置
docker-compose -f docker-compose.dev.yml up -d
```

## 🔧 服务地址

启动成功后，可以访问以下地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| **应用主页** | http://localhost:3000 | 应用首页 |
| **现代UI** | http://localhost:3000/index-modern.html | 推荐界面 |
| **经典UI** | http://localhost:3000/index.html | 传统界面 |
| **欢迎页面** | http://localhost:3000/welcome.html | 界面选择 |
| **健康检查** | http://localhost:3000/api/health | 服务状态 |
| **phpMyAdmin** | http://localhost:8080 | 数据库管理 |
| **Adminer** | http://localhost:8081 | 轻量数据库管理 |
| **RedisInsight** | http://localhost:8001 | Redis管理 |

## 📊 管理脚本使用

`docker/manage.sh` 脚本提供了完整的容器管理功能：

```bash
# 服务管理
./docker/manage.sh start     # 启动所有服务
./docker/manage.sh stop      # 停止所有服务
./docker/manage.sh restart   # 重启所有服务
./docker/manage.sh status    # 查看服务状态

# 监控和日志
./docker/manage.sh health    # 健康检查
./docker/manage.sh logs      # 查看日志
./docker/manage.sh logs -f   # 跟踪日志
./docker/manage.sh logs app  # 查看应用日志

# 开发工具
./docker/manage.sh shell     # 进入应用容器
./docker/manage.sh db        # 进入数据库
./docker/manage.sh ps        # 查看容器状态

# 维护操作
./docker/manage.sh backup    # 备份数据
./docker/manage.sh clean     # 清理资源
./docker/manage.sh reset     # 重置所有数据（危险）
./docker/manage.sh build     # 重新构建镜像
```

## 🔍 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :3307
   lsof -i :6379
   
   # 停止占用端口的进程
   ./docker/manage.sh stop
   ```

2. **数据库连接问题**
   ```bash
   # 检查数据库服务
   ./docker/manage.sh health
   
   # 查看数据库日志
   ./docker/manage.sh logs database
   
   # 重启数据库
   docker-compose -f docker-compose.local.yml restart database
   ```

3. **权限问题**
   ```bash
   # 修复文件权限
   chmod +x docker/manage.sh
   chmod +x docker/entrypoint.sh
   
   # 修复卷权限
   ./docker/manage.sh shell
   chown -R node:node /app
   ```

4. **网络问题**
   ```bash
   # 重建网络
   docker network rm kdfamily-local-network || true
   ./docker/manage.sh start
   ```

### 调试模式

```bash
# 启用详细日志
DEBUG=kdfamily:* npm start

# 使用Node.js调试器
# 连接到 localhost:9229
```

## 🔧 环境配置

### 数据库配置选项

```bash
# MySQL (Docker)
DB_TYPE=mysql
DB_HOST=database
DB_PORT=3306
DB_NAME=kdfamily_dev
DB_USER=kdfamily_user
DB_PASSWORD=kdfamily_pass_2024

# SQLite (本地)
DB_TYPE=sqlite
# 其他DB_*变量会被忽略
```

### 安全配置

```bash
# 生产环境请修改这些密钥
JWT_SECRET=change_in_production
SESSION_SECRET=change_in_production
MYSQL_ROOT_PASSWORD=change_in_production
```

## 📦 Docker卷管理

规范化的卷命名：

- `kdfamily-local-database-data` - 数据库数据
- `kdfamily-local-cache-data` - Redis数据
- `kdfamily-local-app-uploads` - 上传文件
- `kdfamily-local-app-logs` - 应用日志
- `kdfamily-local-app-node-modules` - Node模块缓存

```bash
# 查看所有卷
docker volume ls | grep kdfamily-local

# 清理未使用的卷
docker volume prune
```

## 🚀 生产部署建议

1. **使用生产配置**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

2. **环境变量安全**
   - 使用Docker secrets或环境变量管理
   - 不要在代码中硬编码密钥

3. **数据持久化**
   - 确保数据库和上传文件卷的备份
   - 使用外部存储服务

4. **监控和日志**
   - 配置日志聚合
   - 设置监控和告警

## 📝 开发注意事项

1. **热加载**
   - 源代码修改会自动重启应用
   - 静态文件修改立即生效

2. **数据库**
   - 首次启动会自动创建必要的表
   - 开发数据会持久化在Docker卷中

3. **调试**
   - Node.js调试端口：9229
   - VS Code可直接附加调试器

## ✅ 验证部署

```bash
# 1. 检查所有服务状态
./docker/manage.sh health

# 2. 测试应用访问
curl http://localhost:3000/api/health

# 3. 检查数据库连接
./docker/manage.sh db
# 在MySQL中执行：SHOW DATABASES;

# 4. 测试UI界面
# 浏览器访问：http://localhost:3000/welcome.html
```

## 🆘 支持和帮助

如果遇到问题：

1. 首先运行健康检查：`./docker/manage.sh health`
2. 查看相关服务日志：`./docker/manage.sh logs [service]`
3. 检查网络和端口：`./docker/manage.sh ps`
4. 尝试重启服务：`./docker/manage.sh restart`

---

## 🎉 部署成功！

KD之家Docker环境已成功配置，包含：
- ✅ 规范化命名系统
- ✅ 热加载开发环境  
- ✅ 完整服务栈
- ✅ 自动化管理脚本
- ✅ 健康检查和监控
- ✅ 故障排除指南

现在可以开始开发或部署到生产环境了！