# Docker 开发规范 - KD_Family

> 本文档定义所有 Docker 容器、镜像、卷的命名规范和调试配置要求  
> 每次启动开发环境前必须遵循此规范

## 🎯 核心规范

### 1. 命名规则 - 绝对禁止随机字符串
```bash
# ✅ 正确格式
{project}-{service}-{env}

# ❌ 禁止格式  
kd-family_db_1_a7f8d9e2  # 随机后缀
mysql-8.0-8a7f9d  # 随机字符串
```

### 2. 固定端口映射
基于 `port_mapping.md` 的 KD Family 端口分配（8xxx 段）：

| 服务 | 容器端口 | 宿主端口 | 调试端口 |
|------|----------|----------|----------|
| Web前端 | 3000 | 8000 | 9229 |
| API后端 | 3000 | 8100 | 9230 |
| MySQL | 3306 | 8200 | - |
| Redis | 6379 | 8201 | - |

## 📋 标准化容器配置

### 容器命名模板
```yaml
# docker-compose.yml 标准模板
version: '3.8'

services:
  kd-family-web-dev:
    container_name: kd-family-web-dev
    image: kd-family-web:dev
    ports:
      - "8000:3000"
      - "9229:9229"  # 调试端口
    volumes:
      - kd-family-web-code:/app
      - kd-family-web-modules:/app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=*
    command: npm run dev

  kd-family-api-dev:
    container_name: kd-family-api-dev  
    image: kd-family-api:dev
    ports:
      - "8100:3000"
      - "9230:9230"  # 调试端口
    volumes:
      - kd-family-api-code:/app
      - kd-family-api-modules:/app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=*
    command: npm run dev:debug

  kd-family-db-dev:
    container_name: kd-family-db-dev
    image: mysql:8.0
    ports:
      - "8200:3306"
    volumes:
      - kd-family-db-data:/var/lib/mysql
      - kd-family-db-config:/etc/mysql/conf.d
    environment:
      - MYSQL_ROOT_PASSWORD=kd_family_dev_2025
      - MYSQL_DATABASE=kd_family_dev

volumes:
  kd-family-web-code:
    name: kd-family-web-code
  kd-family-web-modules:
    name: kd-family-web-modules
  kd-family-api-code:
    name: kd-family-api-code
  kd-family-api-modules:
    name: kd-family-api-modules
  kd-family-db-data:
    name: kd-family-db-data
  kd-family-db-config:
    name: kd-family-db-config
```

## 🔧 热重载配置要求

### Node.js 服务热重载
```dockerfile
# Dockerfile.dev 示例
FROM node:18-alpine

WORKDIR /app

# 安装 nodemon 用于热重载
RUN npm install -g nodemon

# 复制 package 文件
COPY package*.json ./
RUN npm install

# 开发模式启动命令
CMD ["npm", "run", "dev"]
```

### package.json 调试脚本
```json
{
  "scripts": {
    "dev": "nodemon --inspect=0.0.0.0:9229 server.js",
    "dev:debug": "nodemon --inspect-brk=0.0.0.0:9230 server.js"
  }
}
```

## 🚀 启动检查清单

### 启动前必检项目
```bash
# 1. 清理旧容器和卷（如有随机命名）
docker container prune -f
docker volume prune -f

# 2. 验证命名规范
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep kd-family

# 3. 检查端口占用
netstat -an | findstr "8000 8100 8200"

# 4. 确认调试端口
netstat -an | findstr "9229 9230"
```

### 标准启动命令
```bash
# 开发环境一键启动
docker-compose -f docker-compose.dev.yml up -d

# 查看实时日志
docker-compose -f docker-compose.dev.yml logs -f

# 调试模式重启单个服务
docker-compose -f docker-compose.dev.yml restart kd-family-api-dev
```

## 🔍 调试端口配置

### VS Code 调试配置 (.vscode/launch.json)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "KD-Family API Debug",
      "type": "node",
      "request": "attach",
      "port": 9230,
      "address": "localhost",
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app",
      "protocol": "inspector"
    }
  ]
}
```

### Chrome DevTools 连接
```
chrome://inspect/#devices
添加网络目标: localhost:9229 (前端)
添加网络目标: localhost:9230 (后端)
```

## ⚠️ 违规处理

### 检测脚本
```bash
#!/bin/bash
# check-docker-compliance.sh

echo "🔍 检查 Docker 合规性..."

# 检查随机命名
RANDOM_CONTAINERS=$(docker ps --format "{{.Names}}" | grep -E '_[a-f0-9]{8,}$|[a-f0-9]{12,}')
if [ ! -z "$RANDOM_CONTAINERS" ]; then
    echo "❌ 发现随机命名容器:"
    echo "$RANDOM_CONTAINERS"
    exit 1
fi

# 检查端口冲突
PORT_CONFLICTS=$(netstat -an | grep -E ":(8000|8100|8200|9229|9230)" | grep LISTEN | wc -l)
if [ $PORT_CONFLICTS -gt 5 ]; then
    echo "❌ 端口冲突或重复占用"
    exit 1
fi

echo "✅ Docker 配置符合规范"
```

## 📝 集成到 CLAUDE.md

将以下内容追加到 `docs/CLAUDE.md`：

```markdown
## Docker 开发规范
- **命名规则**: 必须使用 `kd-family-{service}-dev` 格式，禁止随机字符串
- **端口映射**: 严格按照 `port_mapping.md` 中的 8xxx 段分配
- **调试端口**: Web(9229), API(9230) 固定不变
- **热重载**: 开发模式必须启用，使用 nodemon + volume 挂载
- **启动检查**: 每次启动前运行 `bash check-docker-compliance.sh`
- **详细规范**: 参考 `docs/docker-dev-rules.md`
```

---

*本规范确保团队开发环境的一致性和可调试性，严禁任何形式的随机命名*