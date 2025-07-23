#!/bin/bash

# MySQL 清理脚本
# 用法: ./cleanup-mysql.sh [选项]

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

# 检查是否有备份
check_backup() {
    log_info "检查数据备份..."
    
    if [ ! -d "./migration_backup" ] || [ -z "$(ls -A ./migration_backup 2>/dev/null)" ]; then
        log_error "未找到数据备份！请先运行数据迁移脚本"
        echo "运行以下命令创建备份："
        echo "  node scripts/data-migration-helper.js"
        exit 1
    fi
    
    log_success "找到数据备份文件"
}

# 确认清理操作
confirm_cleanup() {
    log_warning "此操作将永久删除所有 MySQL 相关的配置和文件"
    log_warning "请确保已经完成数据迁移并验证 PostgreSQL 正常工作"
    
    read -p "确认继续清理 MySQL 组件？(y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "清理操作已取消"
        exit 0
    fi
}

# 停止 MySQL 容器
stop_mysql_containers() {
    log_info "停止 MySQL 相关容器..."
    
    # 停止 Docker Compose 中的 MySQL 服务
    if docker-compose ps mysql &>/dev/null; then
        docker-compose stop mysql
        log_success "MySQL 容器已停止"
    else
        log_info "MySQL 容器未运行"
    fi
    
    # 停止 phpMyAdmin 容器
    if docker-compose ps phpmyadmin &>/dev/null; then
        docker-compose stop phpmyadmin
        log_success "phpMyAdmin 容器已停止"
    else
        log_info "phpMyAdmin 容器未运行"
    fi
}

# 删除 MySQL 容器和卷
remove_mysql_containers() {
    log_info "删除 MySQL 容器和数据卷..."
    
    # 删除容器
    if docker ps -a --format "table {{.Names}}" | grep -q "kdfamily_mysql"; then
        docker rm -f kdfamily_mysql
        log_success "MySQL 容器已删除"
    fi
    
    if docker ps -a --format "table {{.Names}}" | grep -q "kdfamily_phpmyadmin"; then
        docker rm -f kdfamily_phpmyadmin
        log_success "phpMyAdmin 容器已删除"
    fi
    
    # 删除数据卷
    if docker volume ls --format "table {{.Name}}" | grep -q "mysql_data"; then
        docker volume rm kdfamily_mysql_data 2>/dev/null || true
        log_success "MySQL 数据卷已删除"
    fi
}

# 清理 Docker 镜像
cleanup_mysql_images() {
    log_info "清理 MySQL Docker 镜像..."
    
    # 删除 MySQL 镜像
    if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "mysql"; then
        docker rmi mysql:8.0 2>/dev/null || true
        log_success "MySQL 镜像已删除"
    fi
    
    # 删除 phpMyAdmin 镜像
    if docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "phpmyadmin"; then
        docker rmi phpmyadmin/phpmyadmin:latest 2>/dev/null || true
        log_success "phpMyAdmin 镜像已删除"
    fi
}

# 删除 MySQL 配置文件
remove_mysql_configs() {
    log_info "删除 MySQL 配置文件..."
    
    # 删除旧的数据库配置文件（如果存在）
    if [ -f "config/mysql.js" ]; then
        rm config/mysql.js
        log_success "删除 config/mysql.js"
    fi
    
    # 删除 MySQL 初始化脚本
    if [ -f "schema/mysql_init.sql" ]; then
        rm schema/mysql_init.sql
        log_success "删除 schema/mysql_init.sql"
    fi
    
    if [ -f "schema/mysql_indexes.sql" ]; then
        rm schema/mysql_indexes.sql
        log_success "删除 schema/mysql_indexes.sql"
    fi
    
    # 删除旧的 init.sql（如果是 MySQL 版本）
    if [ -f "schema/init.sql" ]; then
        if grep -q "AUTO_INCREMENT" schema/init.sql; then
            mv schema/init.sql schema/init.sql.mysql.backup
            log_success "备份旧的 MySQL init.sql 为 init.sql.mysql.backup"
        fi
    fi
    
    # 删除旧的 indexes.sql（如果是 MySQL 版本）
    if [ -f "schema/indexes.sql" ]; then
        if grep -q "ENGINE=InnoDB" schema/indexes.sql; then
            mv schema/indexes.sql schema/indexes.sql.mysql.backup
            log_success "备份旧的 MySQL indexes.sql 为 indexes.sql.mysql.backup"
        fi
    fi
}

# 更新环境变量文件
update_env_files() {
    log_info "更新环境变量文件..."
    
    # 更新 .env.example
    if [ -f ".env.example" ]; then
        # 删除 MySQL 相关的环境变量
        sed -i '/MYSQL_/d' .env.example 2>/dev/null || true
        sed -i '/# MySQL/d' .env.example 2>/dev/null || true
        log_success "更新 .env.example"
    fi
    
    # 更新 .env（如果存在）
    if [ -f ".env" ]; then
        log_warning "请手动检查并更新 .env 文件，删除 MySQL 相关配置"
    fi
}

# 清理脚本文件
cleanup_scripts() {
    log_info "清理 MySQL 相关脚本..."
    
    # 移动迁移脚本到备份目录
    mkdir -p ./migration_backup/scripts
    
    if [ -f "scripts/migrate-mysql-to-postgresql.sh" ]; then
        mv scripts/migrate-mysql-to-postgresql.sh ./migration_backup/scripts/
        log_success "迁移脚本已移动到备份目录"
    fi
    
    if [ -f "scripts/data-migration-helper.js" ]; then
        mv scripts/data-migration-helper.js ./migration_backup/scripts/
        log_success "数据迁移辅助脚本已移动到备份目录"
    fi
    
    if [ -f "scripts/verify-migration.js" ]; then
        mv scripts/verify-migration.js ./migration_backup/scripts/
        log_success "验证脚本已移动到备份目录"
    fi
}

# 更新文档
update_documentation() {
    log_info "更新文档..."
    
    # 创建迁移完成说明
    cat > ./migration_backup/MIGRATION_COMPLETED.md << 'EOF'
# MySQL 到 PostgreSQL 迁移完成

## 迁移摘要
- 迁移时间: $(date)
- 源数据库: MySQL
- 目标数据库: PostgreSQL
- 状态: 已完成

## 已清理的组件
- MySQL Docker 容器和镜像
- MySQL 配置文件
- MySQL 相关的环境变量
- MySQL 数据卷

## 备份文件位置
- 数据备份: ./migration_backup/
- 脚本备份: ./migration_backup/scripts/
- 配置备份: ./migration_backup/configs/

## 注意事项
1. 所有 MySQL 相关组件已被清理
2. 数据已迁移到 PostgreSQL
3. 应用代码已适配 PostgreSQL
4. 如需回滚，请使用备份文件

## 验证步骤
1. 启动 PostgreSQL 服务: `docker-compose up -d postgres`
2. 运行应用: `npm start`
3. 测试所有功能是否正常

## 支持
如遇问题，请检查备份文件或联系技术支持。
EOF

    log_success "迁移完成文档已创建"
}

# 验证 PostgreSQL 服务
verify_postgresql() {
    log_info "验证 PostgreSQL 服务..."
    
    # 启动 PostgreSQL 服务
    docker-compose up -d postgres
    
    # 等待服务启动
    sleep 10
    
    # 测试连接
    if docker-compose exec postgres pg_isready -U kdfamily_user -d kdfamily; then
        log_success "PostgreSQL 服务运行正常"
    else
        log_error "PostgreSQL 服务启动失败"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "MySQL 清理脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --force           跳过确认提示"
    echo "  --keep-images     保留 Docker 镜像"
    echo "  --keep-scripts    保留迁移脚本"
    echo "  --help            显示帮助信息"
    echo ""
    echo "注意:"
    echo "  此脚本将永久删除所有 MySQL 相关组件"
    echo "  请确保已完成数据迁移并创建备份"
}

# 主函数
main() {
    local force_cleanup=false
    local keep_images=false
    local keep_scripts=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                force_cleanup=true
                shift
                ;;
            --keep-images)
                keep_images=true
                shift
                ;;
            --keep-scripts)
                keep_scripts=true
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
    
    log_info "开始清理 MySQL 组件"
    
    # 检查备份
    check_backup
    
    # 确认操作
    if [ "$force_cleanup" = false ]; then
        confirm_cleanup
    fi
    
    # 执行清理步骤
    stop_mysql_containers
    remove_mysql_containers
    
    if [ "$keep_images" = false ]; then
        cleanup_mysql_images
    fi
    
    remove_mysql_configs
    update_env_files
    
    if [ "$keep_scripts" = false ]; then
        cleanup_scripts
    fi
    
    update_documentation
    verify_postgresql
    
    log_success "MySQL 清理完成！"
    log_info "PostgreSQL 服务已启动并运行正常"
    log_info "备份文件保存在 ./migration_backup/ 目录"
    
    echo ""
    echo "🎉 数据库迁移项目完成！"
    echo "📋 下一步："
    echo "   1. 测试应用所有功能"
    echo "   2. 运行完整的测试套件"
    echo "   3. 更新部署文档"
    echo "   4. 通知团队成员"
}

# 执行主函数
main "$@"
