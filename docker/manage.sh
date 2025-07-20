#!/bin/bash

# KD Family Docker 管理脚本
# 用法: ./docker/manage.sh [命令] [选项]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="kdfamily"
COMPOSE_FILE="docker-compose.local.yml"
ENV_FILE=".env.local"

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

log_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}🏠 KD Family Docker 管理${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# 显示帮助信息
show_help() {
    echo "KD Family Docker 管理脚本"
    echo ""
    echo "用法: $0 [命令] [选项]"
    echo ""
    echo "命令:"
    echo "  start    - 启动所有服务"
    echo "  stop     - 停止所有服务"
    echo "  restart  - 重启所有服务"
    echo "  status   - 查看服务状态"
    echo "  logs     - 查看日志"
    echo "  shell    - 进入应用容器"
    echo "  db       - 进入数据库容器"
    echo "  clean    - 清理容器和镜像"
    echo "  reset    - 重置所有数据（危险操作）"
    echo "  build    - 重新构建镜像"
    echo "  ps       - 查看容器状态"
    echo "  health   - 检查服务健康状态"
    echo "  backup   - 备份数据"
    echo "  restore  - 恢复数据"
    echo ""
    echo "选项:"
    echo "  -f, --follow    - 跟踪日志输出"
    echo "  -v, --verbose   - 详细输出"
    echo "  --no-cache      - 构建时不使用缓存"
    echo "  --force         - 强制执行操作"
    echo ""
    echo "示例:"
    echo "  $0 start                    # 启动所有服务"
    echo "  $0 logs app                 # 查看应用日志"
    echo "  $0 logs -f                  # 跟踪所有日志"
    echo "  $0 shell                    # 进入应用容器"
    echo "  $0 build --no-cache         # 重新构建镜像"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose 文件不存在: $COMPOSE_FILE"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 检查环境文件
check_env() {
    if [ ! -f ".env" ]; then
        if [ -f "$ENV_FILE" ]; then
            log_warning ".env 文件不存在，复制 $ENV_FILE 作为默认配置"
            cp "$ENV_FILE" ".env"
            log_success "已创建 .env 文件"
        else
            log_error "环境配置文件不存在，请创建 .env 文件"
            exit 1
        fi
    fi
}

# 启动服务
start_services() {
    log_header
    log_info "启动 KD Family 开发环境..."
    
    check_dependencies
    check_env
    
    # 确保网络存在
    docker network create kdfamily-local-network 2>/dev/null || true
    
    # 启动服务
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "服务启动完成！"
    echo ""
    show_services_info
}

# 停止服务
stop_services() {
    log_header
    log_info "停止 KD Family 服务..."
    
    docker-compose -f "$COMPOSE_FILE" down
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    log_header
    log_info "重启 KD Family 服务..."
    
    stop_services
    sleep 2
    start_services
}

# 查看服务状态
show_status() {
    log_header
    log_info "服务状态:"
    echo ""
    
    docker-compose -f "$COMPOSE_FILE" ps
}

# 查看日志
show_logs() {
    local service=${1:-}
    local follow=${2:-false}
    
    log_info "查看日志..."
    
    if [ "$follow" = "true" ]; then
        if [ -n "$service" ]; then
            docker-compose -f "$COMPOSE_FILE" logs -f "$service"
        else
            docker-compose -f "$COMPOSE_FILE" logs -f
        fi
    else
        if [ -n "$service" ]; then
            docker-compose -f "$COMPOSE_FILE" logs --tail=100 "$service"
        else
            docker-compose -f "$COMPOSE_FILE" logs --tail=100
        fi
    fi
}

# 进入容器Shell
enter_shell() {
    local service=${1:-app}
    
    log_info "进入 $service 容器..."
    
    if [ "$service" = "db" ] || [ "$service" = "database" ]; then
        docker-compose -f "$COMPOSE_FILE" exec database mysql -u root -p
    else
        docker-compose -f "$COMPOSE_FILE" exec "$service" /bin/bash
    fi
}

# 清理容器和镜像
clean_docker() {
    local force=${1:-false}
    
    log_header
    log_warning "清理 Docker 资源..."
    
    if [ "$force" != "true" ]; then
        read -p "确定要清理所有相关的 Docker 资源吗? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "操作已取消"
            return
        fi
    fi
    
    # 停止并删除容器
    docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
    
    # 删除镜像
    docker images | grep "kdfamily" | awk '{print $3}' | xargs -r docker rmi -f
    
    # 清理悬空镜像
    docker image prune -f
    
    # 清理网络
    docker network prune -f
    
    log_success "清理完成"
}

# 重置所有数据
reset_data() {
    log_header
    log_error "⚠️  危险操作: 重置所有数据 ⚠️"
    echo ""
    log_warning "这将删除所有数据库数据、上传文件和日志！"
    read -p "确定要继续吗? 请输入 'RESET' 确认: " -r
    echo
    
    if [ "$REPLY" != "RESET" ]; then
        log_info "操作已取消"
        return
    fi
    
    # 停止服务
    docker-compose -f "$COMPOSE_FILE" down -v
    
    # 删除所有卷
    docker volume ls | grep "kdfamily-local" | awk '{print $2}' | xargs -r docker volume rm
    
    # 删除本地数据目录
    rm -rf uploads logs temp data coverage
    
    log_success "数据重置完成"
    log_info "下次启动将使用全新的数据"
}

# 构建镜像
build_images() {
    local no_cache=${1:-false}
    
    log_header
    log_info "构建 KD Family 镜像..."
    
    if [ "$no_cache" = "true" ]; then
        docker-compose -f "$COMPOSE_FILE" build --no-cache
    else
        docker-compose -f "$COMPOSE_FILE" build
    fi
    
    log_success "镜像构建完成"
}

# 显示容器状态
show_ps() {
    log_header
    log_info "容器状态:"
    echo ""
    
    # 显示项目相关的容器
    docker ps -a --filter "name=kdfamily-local" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# 检查健康状态
check_health() {
    log_header
    log_info "检查服务健康状态..."
    echo ""
    
    # 检查各个服务
    services=("database" "cache" "app" "db-admin" "db-viewer" "cache-admin")
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            # 检查健康状态
            health=$(docker inspect "kdfamily-local-$service" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
            
            case $health in
                "healthy")
                    echo -e "${GREEN}✅ $service: 健康${NC}"
                    ;;
                "unhealthy")
                    echo -e "${RED}❌ $service: 不健康${NC}"
                    ;;
                "starting")
                    echo -e "${YELLOW}🔄 $service: 启动中${NC}"
                    ;;
                "no-healthcheck")
                    echo -e "${BLUE}ℹ️  $service: 运行中 (无健康检查)${NC}"
                    ;;
                *)
                    echo -e "${YELLOW}⚠️  $service: 状态未知${NC}"
                    ;;
            esac
        else
            echo -e "${RED}❌ $service: 未运行${NC}"
        fi
    done
    
    echo ""
    log_info "检查网络连接..."
    
    # 检查端口是否开放
    ports=("3000:应用" "3307:MySQL" "6379:Redis" "8080:phpMyAdmin" "8081:Adminer" "8001:RedisInsight")
    
    for port_info in "${ports[@]}"; do
        port=$(echo "$port_info" | cut -d: -f1)
        name=$(echo "$port_info" | cut -d: -f2)
        
        if nc -z localhost "$port" 2>/dev/null; then
            echo -e "${GREEN}✅ $name (端口 $port): 可访问${NC}"
        else
            echo -e "${RED}❌ $name (端口 $port): 不可访问${NC}"
        fi
    done
}

# 备份数据
backup_data() {
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    
    log_header
    log_info "备份数据到 $backup_dir..."
    
    mkdir -p "$backup_dir"
    
    # 备份数据库
    if docker-compose -f "$COMPOSE_FILE" ps database | grep -q "Up"; then
        log_info "备份数据库..."
        docker-compose -f "$COMPOSE_FILE" exec -T database mysqldump \
            -u root -p"${MYSQL_ROOT_PASSWORD:-kdfamily_root_2024}" \
            --all-databases --routines --triggers > "$backup_dir/database.sql"
    fi
    
    # 备份上传文件
    if [ -d "uploads" ]; then
        log_info "备份上传文件..."
        cp -r uploads "$backup_dir/"
    fi
    
    # 备份配置文件
    log_info "备份配置文件..."
    cp .env "$backup_dir/" 2>/dev/null || true
    cp "$ENV_FILE" "$backup_dir/" 2>/dev/null || true
    
    log_success "备份完成: $backup_dir"
}

# 显示服务信息
show_services_info() {
    echo -e "${CYAN}===== 🏠 KD Family 服务信息 =====${NC}"
    echo ""
    echo -e "${GREEN}📱 应用访问地址:${NC}"
    echo "   - 应用首页: http://localhost:3000"
    echo "   - 现代UI: http://localhost:3000/index-modern.html"
    echo "   - 经典UI: http://localhost:3000/index.html"
    echo "   - 健康检查: http://localhost:3000/api/health"
    echo ""
    echo -e "${GREEN}🔧 管理界面:${NC}"
    echo "   - phpMyAdmin: http://localhost:8080"
    echo "   - Adminer: http://localhost:8081"
    echo "   - RedisInsight: http://localhost:8001"
    echo ""
    echo -e "${GREEN}🐛 开发工具:${NC}"
    echo "   - Node.js 调试端口: 9229"
    echo "   - 直接数据库连接: localhost:3307"
    echo "   - 直接Redis连接: localhost:6379"
    echo ""
    echo -e "${GREEN}📊 监控命令:${NC}"
    echo "   - 查看日志: $0 logs"
    echo "   - 查看状态: $0 status"
    echo "   - 健康检查: $0 health"
    echo ""
    echo -e "${CYAN}================================${NC}"
}

# 主函数
main() {
    local command=${1:-help}
    local arg1=${2:-}
    local arg2=${3:-}
    
    case $command in
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            local follow=false
            if [ "$arg1" = "-f" ] || [ "$arg1" = "--follow" ] || [ "$arg2" = "-f" ] || [ "$arg2" = "--follow" ]; then
                follow=true
            fi
            if [ "$arg1" != "-f" ] && [ "$arg1" != "--follow" ]; then
                show_logs "$arg1" "$follow"
            else
                show_logs "" "$follow"
            fi
            ;;
        "shell")
            enter_shell "$arg1"
            ;;
        "db")
            enter_shell "database"
            ;;
        "clean")
            local force=false
            if [ "$arg1" = "--force" ]; then
                force=true
            fi
            clean_docker "$force"
            ;;
        "reset")
            reset_data
            ;;
        "build")
            local no_cache=false
            if [ "$arg1" = "--no-cache" ]; then
                no_cache=true
            fi
            build_images "$no_cache"
            ;;
        "ps")
            show_ps
            ;;
        "health")
            check_health
            ;;
        "backup")
            backup_data
            ;;
        "info")
            show_services_info
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"