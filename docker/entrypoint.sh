#!/bin/bash

# KD Family 开发环境入口脚本
set -e

echo "🏠 KD Family 开发环境启动中..."
echo "===================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境变量
log_info "检查环境变量..."
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=development
    log_warning "NODE_ENV 未设置，默认使用 development"
fi

if [ -z "$PORT" ]; then
    export PORT=3000
    log_warning "PORT 未设置，默认使用 3000"
fi

log_success "环境变量检查完成"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: $PORT"
echo "  - DB_HOST: ${DB_HOST:-localhost}"
echo "  - REDIS_HOST: ${REDIS_HOST:-localhost}"

# 等待数据库服务
log_info "等待数据库服务启动..."
if [ ! -z "$DB_HOST" ]; then
    while ! nc -z $DB_HOST ${DB_PORT:-3306}; do
        log_warning "等待 MySQL ($DB_HOST:${DB_PORT:-3306}) 启动..."
        sleep 2
    done
    log_success "MySQL 数据库已就绪"
fi

# 等待Redis服务
log_info "等待 Redis 服务启动..."
if [ ! -z "$REDIS_HOST" ]; then
    while ! nc -z $REDIS_HOST ${REDIS_PORT:-6379}; do
        log_warning "等待 Redis ($REDIS_HOST:${REDIS_PORT:-6379}) 启动..."
        sleep 2
    done
    log_success "Redis 缓存已就绪"
fi

# 检查数据库连接
log_info "检查数据库连接..."
if command -v node >/dev/null 2>&1; then
    node -e "
        const { getDatabase } = require('./server/database/connection');
        getDatabase().then(() => {
            console.log('✅ 数据库连接成功');
            process.exit(0);
        }).catch((err) => {
            console.error('❌ 数据库连接失败:', err.message);
            process.exit(1);
        });
    " || {
        log_error "数据库连接失败，但继续启动..."
    }
fi

# 运行数据库迁移
log_info "运行数据库迁移..."
if [ -f "scripts/migrate.js" ]; then
    # 尝试运行迁移，最多重试3次
    retry_count=0
    max_retries=3
    while [ $retry_count -lt $max_retries ]; do
        if npm run migrate:dev; then
            log_success "数据库迁移完成"
            break
        else
            retry_count=$((retry_count + 1))
            if [ $retry_count -lt $max_retries ]; then
                log_warning "数据库迁移失败，等待5秒后重试 ($retry_count/$max_retries)..."
                sleep 5
            else
                log_error "数据库迁移失败，已重试 $max_retries 次，继续启动应用..."
            fi
        fi
    done
else
    log_warning "未找到迁移脚本，跳过迁移"
fi

# 创建必要的目录
log_info "创建应用目录..."
mkdir -p uploads/avatars uploads/medals logs temp data
log_success "应用目录创建完成"

# 设置权限
log_info "设置文件权限..."
chmod -R 755 uploads logs temp data 2>/dev/null || true
log_success "文件权限设置完成"

# 启动应用
log_info "启动 KD Family 应用服务器..."
echo "===================================="
log_success "🚀 应用正在启动，请稍候..."
echo ""
echo "📱 访问地址:"
echo "   - 应用首页: http://localhost:$PORT"
echo "   - 现代UI: http://localhost:$PORT/index-modern.html"
echo "   - 经典UI: http://localhost:$PORT/index.html"
echo "   - 健康检查: http://localhost:$PORT/api/health"
echo ""
echo "🔧 管理界面:"
echo "   - phpMyAdmin: http://localhost:8080"
echo "   - Adminer: http://localhost:8081"
echo "   - RedisInsight: http://localhost:8001"
echo ""
echo "🐛 调试端口: 9229"
echo "===================================="

# 根据环境选择启动命令
if [ "$NODE_ENV" = "development" ]; then
    log_info "启动开发模式 (带调试和热重载)"
    exec npm run dev:debug
elif [ "$NODE_ENV" = "test" ]; then
    log_info "启动测试模式"
    exec npm test
else
    log_info "启动生产模式"
    exec npm start
fi