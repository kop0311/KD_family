#!/bin/bash

# KD Family Caddy 部署脚本
# 用于快速部署和管理Caddy服务器

set -e

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

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端应用..."
    
    cd frontend
    if [ ! -f "package.json" ]; then
        log_error "前端项目不存在"
        exit 1
    fi
    
    # 安装依赖
    if command -v pnpm &> /dev/null; then
        pnpm install
        pnpm build
    else
        npm install
        npm run build
    fi
    
    cd ..
    log_success "前端构建完成"
}

# 部署开发环境
deploy_dev() {
    log_info "部署开发环境..."
    
    # 启动基础服务
    docker-compose -f docker-compose.dev.yml up -d mysql redis
    
    # 等待数据库启动
    log_info "等待数据库启动..."
    sleep 10
    
    # 启动Caddy代理
    docker-compose -f docker-compose.dev.yml --profile proxy up -d caddy-dev
    
    log_success "开发环境部署完成"
    log_info "访问地址:"
    log_info "  - 前端应用: http://localhost:8080"
    log_info "  - 管理工具: http://localhost:8081"
    log_info "  - API文档: http://localhost:3000/api-docs"
}

# 部署生产环境
deploy_prod() {
    log_info "部署生产环境..."
    
    # 检查环境变量
    if [ -z "$DOMAIN" ]; then
        log_error "请设置 DOMAIN 环境变量"
        exit 1
    fi
    
    # 构建前端
    build_frontend
    
    # 更新Caddyfile中的域名
    sed -i "s/kdfamily.example.com/$DOMAIN/g" Caddyfile
    
    # 启动所有服务
    docker-compose -f docker-compose.modern.yml up -d
    
    log_success "生产环境部署完成"
    log_info "访问地址: https://$DOMAIN"
}

# 更新SSL证书
update_ssl() {
    log_info "更新SSL证书..."
    
    docker-compose -f docker-compose.modern.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
    
    log_success "SSL证书更新完成"
}

# 查看日志
view_logs() {
    local service=${1:-caddy}
    log_info "查看 $service 服务日志..."
    
    if [ "$2" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml logs -f $service
    else
        docker-compose -f docker-compose.modern.yml logs -f $service
    fi
}

# 重启服务
restart_service() {
    local service=${1:-caddy}
    local env=${2:-prod}
    
    log_info "重启 $service 服务..."
    
    if [ "$env" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml restart $service
    else
        docker-compose -f docker-compose.modern.yml restart $service
    fi
    
    log_success "$service 服务重启完成"
}

# 停止服务
stop_services() {
    local env=${1:-prod}
    
    log_info "停止服务..."
    
    if [ "$env" = "dev" ]; then
        docker-compose -f docker-compose.dev.yml down
    else
        docker-compose -f docker-compose.modern.yml down
    fi
    
    log_success "服务停止完成"
}

# 清理资源
cleanup() {
    log_warning "清理所有资源..."
    
    docker-compose -f docker-compose.dev.yml down -v
    docker-compose -f docker-compose.modern.yml down -v
    
    # 清理未使用的镜像
    docker image prune -f
    
    log_success "资源清理完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查Caddy状态
    if curl -f http://localhost:8080/health &> /dev/null; then
        log_success "Caddy 服务正常"
    else
        log_error "Caddy 服务异常"
    fi
    
    # 检查后端API
    if curl -f http://localhost:3000/health &> /dev/null; then
        log_success "后端API 服务正常"
    else
        log_error "后端API 服务异常"
    fi
    
    # 检查数据库
    if docker-compose -f docker-compose.modern.yml exec mysql mysqladmin ping -h localhost &> /dev/null; then
        log_success "数据库服务正常"
    else
        log_error "数据库服务异常"
    fi
}

# 显示帮助信息
show_help() {
    echo "KD Family Caddy 部署脚本"
    echo ""
    echo "用法: $0 [命令] [参数]"
    echo ""
    echo "命令:"
    echo "  dev                 部署开发环境"
    echo "  prod                部署生产环境"
    echo "  build               构建前端应用"
    echo "  ssl                 更新SSL证书"
    echo "  logs [service] [env] 查看服务日志"
    echo "  restart [service] [env] 重启服务"
    echo "  stop [env]          停止服务"
    echo "  cleanup             清理所有资源"
    echo "  health              健康检查"
    echo "  help                显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 dev              # 部署开发环境"
    echo "  $0 prod             # 部署生产环境"
    echo "  $0 logs caddy dev   # 查看开发环境Caddy日志"
    echo "  $0 restart backend  # 重启后端服务"
    echo ""
}

# 主函数
main() {
    case "${1:-help}" in
        "dev")
            check_dependencies
            deploy_dev
            ;;
        "prod")
            check_dependencies
            deploy_prod
            ;;
        "build")
            build_frontend
            ;;
        "ssl")
            update_ssl
            ;;
        "logs")
            view_logs "$2" "$3"
            ;;
        "restart")
            restart_service "$2" "$3"
            ;;
        "stop")
            stop_services "$2"
            ;;
        "cleanup")
            cleanup
            ;;
        "health")
            health_check
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 执行主函数
main "$@"
