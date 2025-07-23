#!/bin/bash

# KD Family 部署脚本
# 用法: ./deploy.sh [环境] [选项]
# 环境: development, staging, production
# 选项: --build, --migrate, --seed, --backup, --rollback

set -e  # 遇到错误立即退出

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

# 设置环境变量
setup_environment() {
    local env=$1
    log_info "设置 $env 环境..."
    
    # 复制环境配置文件
    if [ -f ".env.$env" ]; then
        cp ".env.$env" ".env"
        log_success "环境配置已设置"
    else
        log_warning "环境配置文件 .env.$env 不存在，使用默认配置"
    fi
    
    # 设置环境变量
    export NODE_ENV=$env
    export COMPOSE_PROJECT_NAME="kd-family-$env"
    
    # 根据环境设置不同的配置
    case $env in
        "development")
            export COMPOSE_FILE="docker-compose.yml"
            ;;
        "staging")
            export COMPOSE_FILE="docker/docker-compose.staging.yml"
            ;;
        "production")
            export COMPOSE_FILE="docker/docker-compose.production.yml"
            ;;
        *)
            log_error "未知环境: $env"
            exit 1
            ;;
    esac
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    # 构建前端镜像
    docker-compose build frontend
    
    # 如果有后端代码，也构建后端镜像
    if [ -d "backend" ]; then
        docker-compose build backend
    fi
    
    log_success "镜像构建完成"
}

# 数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."
    
    # 等待数据库启动
    docker-compose up -d postgres
    sleep 10
    
    # 运行迁移
    docker-compose exec backend npm run migrate
    
    log_success "数据库迁移完成"
}

# 数据库种子数据
seed_database() {
    log_info "插入种子数据..."
    
    docker-compose exec backend npm run seed
    
    log_success "种子数据插入完成"
}

# 备份数据库
backup_database() {
    local backup_dir="./backups"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$backup_dir/backup_$timestamp.sql"
    
    log_info "备份数据库..."
    
    # 创建备份目录
    mkdir -p $backup_dir
    
    # 执行备份
    docker-compose exec postgres pg_dump -U postgres -d kd_family > $backup_file
    
    # 压缩备份文件
    gzip $backup_file
    
    log_success "数据库备份完成: $backup_file.gz"
}

# 回滚部署
rollback_deployment() {
    log_info "回滚部署..."
    
    # 停止当前服务
    docker-compose down
    
    # 恢复上一个版本的镜像
    # 这里需要根据实际的镜像标签策略来实现
    log_warning "回滚功能需要根据具体的镜像版本管理策略来实现"
    
    log_success "回滚完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_success "应用健康检查通过"
            return 0
        fi
        
        log_info "等待应用启动... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    log_error "健康检查失败"
    return 1
}

# 部署服务
deploy_services() {
    log_info "部署服务..."
    
    # 停止现有服务
    docker-compose down
    
    # 启动服务
    docker-compose up -d
    
    # 等待服务启动
    sleep 30
    
    # 健康检查
    if health_check; then
        log_success "服务部署成功"
    else
        log_error "服务部署失败"
        exit 1
    fi
}

# 清理旧镜像
cleanup_images() {
    log_info "清理旧镜像..."
    
    # 删除悬空镜像
    docker image prune -f
    
    # 删除旧版本镜像（保留最近3个版本）
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
    grep "kd-family" | \
    tail -n +4 | \
    awk '{print $1}' | \
    xargs -r docker rmi
    
    log_success "镜像清理完成"
}

# 显示帮助信息
show_help() {
    echo "KD Family 部署脚本"
    echo ""
    echo "用法: $0 [环境] [选项]"
    echo ""
    echo "环境:"
    echo "  development    开发环境"
    echo "  staging        测试环境"
    echo "  production     生产环境"
    echo ""
    echo "选项:"
    echo "  --build        构建镜像"
    echo "  --migrate      运行数据库迁移"
    echo "  --seed         插入种子数据"
    echo "  --backup       备份数据库"
    echo "  --rollback     回滚部署"
    echo "  --cleanup      清理旧镜像"
    echo "  --help         显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 production --build --migrate"
    echo "  $0 development --seed"
    echo "  $0 production --backup"
}

# 主函数
main() {
    local environment=""
    local build_flag=false
    local migrate_flag=false
    local seed_flag=false
    local backup_flag=false
    local rollback_flag=false
    local cleanup_flag=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            development|staging|production)
                environment=$1
                shift
                ;;
            --build)
                build_flag=true
                shift
                ;;
            --migrate)
                migrate_flag=true
                shift
                ;;
            --seed)
                seed_flag=true
                shift
                ;;
            --backup)
                backup_flag=true
                shift
                ;;
            --rollback)
                rollback_flag=true
                shift
                ;;
            --cleanup)
                cleanup_flag=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查环境参数
    if [ -z "$environment" ]; then
        log_error "请指定环境"
        show_help
        exit 1
    fi
    
    log_info "开始部署 KD Family 到 $environment 环境"
    
    # 检查依赖
    check_dependencies
    
    # 设置环境
    setup_environment $environment
    
    # 执行备份（如果指定）
    if [ "$backup_flag" = true ]; then
        backup_database
    fi
    
    # 执行回滚（如果指定）
    if [ "$rollback_flag" = true ]; then
        rollback_deployment
        exit 0
    fi
    
    # 构建镜像（如果指定）
    if [ "$build_flag" = true ]; then
        build_images
    fi
    
    # 部署服务
    deploy_services
    
    # 运行迁移（如果指定）
    if [ "$migrate_flag" = true ]; then
        run_migrations
    fi
    
    # 插入种子数据（如果指定）
    if [ "$seed_flag" = true ]; then
        seed_database
    fi
    
    # 清理镜像（如果指定）
    if [ "$cleanup_flag" = true ]; then
        cleanup_images
    fi
    
    log_success "部署完成！"
    log_info "应用访问地址: http://localhost:3000"
    
    if [ "$environment" = "production" ]; then
        log_info "生产环境部署完成，请确保:"
        log_info "1. SSL 证书配置正确"
        log_info "2. 域名解析正确"
        log_info "3. 防火墙规则配置正确"
        log_info "4. 监控系统正常运行"
    fi
}

# 执行主函数
main "$@"
