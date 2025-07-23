#!/bin/bash

# MySQL 到 PostgreSQL 数据迁移脚本
# 用法: ./migrate-mysql-to-postgresql.sh [选项]

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

# 配置变量
MYSQL_HOST=${MYSQL_HOST:-localhost}
MYSQL_PORT=${MYSQL_PORT:-3307}
MYSQL_USER=${MYSQL_USER:-kdfamily_user}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-kdfamily_pass}
MYSQL_DATABASE=${MYSQL_DATABASE:-kdfamily}

POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5433}
POSTGRES_USER=${POSTGRES_USER:-kdfamily_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-kdfamily_pass}
POSTGRES_DATABASE=${POSTGRES_DATABASE:-kdfamily}

BACKUP_DIR="./migration_backup"
TEMP_DIR="./migration_temp"

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL 客户端未安装"
        exit 1
    fi
    
    if ! command -v psql &> /dev/null; then
        log_error "PostgreSQL 客户端未安装"
        exit 1
    fi
    
    if ! command -v mysqldump &> /dev/null; then
        log_error "mysqldump 未安装"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 创建备份目录
setup_directories() {
    log_info "创建工作目录..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$TEMP_DIR"
    log_success "目录创建完成"
}

# 测试数据库连接
test_connections() {
    log_info "测试数据库连接..."
    
    # 测试 MySQL 连接
    if ! mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;" "$MYSQL_DATABASE" &> /dev/null; then
        log_error "无法连接到 MySQL 数据库"
        exit 1
    fi
    log_success "MySQL 连接正常"
    
    # 测试 PostgreSQL 连接
    if ! PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" -c "SELECT 1;" &> /dev/null; then
        log_error "无法连接到 PostgreSQL 数据库"
        exit 1
    fi
    log_success "PostgreSQL 连接正常"
}

# 备份 MySQL 数据
backup_mysql_data() {
    log_info "备份 MySQL 数据..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/mysql_backup_$timestamp.sql"
    
    mysqldump -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
        --single-transaction \
        --routines \
        --triggers \
        --add-drop-table \
        --extended-insert \
        --complete-insert \
        "$MYSQL_DATABASE" > "$backup_file"
    
    log_success "MySQL 数据备份完成: $backup_file"
    echo "$backup_file"
}

# 导出 MySQL 数据为 CSV
export_mysql_to_csv() {
    log_info "导出 MySQL 数据为 CSV..."
    
    local tables=("users" "task_types" "tasks" "points_history" "notifications")
    
    for table in "${tables[@]}"; do
        log_info "导出表: $table"
        
        mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
            -e "SELECT * FROM $table;" \
            --batch --raw \
            "$MYSQL_DATABASE" > "$TEMP_DIR/${table}.csv"
        
        # 添加表头
        mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
            -e "DESCRIBE $table;" \
            --batch --raw \
            "$MYSQL_DATABASE" | awk '{print $1}' | tr '\n' ',' | sed 's/,$/\n/' > "$TEMP_DIR/${table}_header.csv"
        
        # 合并表头和数据
        cat "$TEMP_DIR/${table}_header.csv" "$TEMP_DIR/${table}.csv" > "$TEMP_DIR/${table}_with_header.csv"
    done
    
    log_success "CSV 导出完成"
}

# 创建数据转换脚本
create_conversion_script() {
    log_info "创建数据转换脚本..."
    
    cat > "$TEMP_DIR/convert_data.py" << 'EOF'
#!/usr/bin/env python3
import csv
import sys
import re
from datetime import datetime

def convert_mysql_to_postgresql(input_file, output_file, table_name):
    """转换 MySQL CSV 数据为 PostgreSQL 兼容格式"""
    
    with open(input_file, 'r', encoding='utf-8') as infile, \
         open(output_file, 'w', encoding='utf-8') as outfile:
        
        reader = csv.reader(infile)
        writer = csv.writer(outfile)
        
        for row_num, row in enumerate(reader):
            if row_num == 0:  # 跳过表头
                continue
                
            converted_row = []
            for cell in row:
                # 处理 NULL 值
                if cell == 'NULL' or cell == '\\N':
                    converted_row.append('')
                # 处理布尔值
                elif cell in ('0', '1') and table_name in ['tasks', 'users']:
                    converted_row.append('false' if cell == '0' else 'true')
                # 处理日期时间
                elif re.match(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}', cell):
                    # MySQL TIMESTAMP 转 PostgreSQL TIMESTAMPTZ
                    converted_row.append(cell + '+00')
                # 处理枚举值（保持原样）
                else:
                    converted_row.append(cell)
            
            writer.writerow(converted_row)

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python3 convert_data.py <input_file> <output_file> <table_name>")
        sys.exit(1)
    
    convert_mysql_to_postgresql(sys.argv[1], sys.argv[2], sys.argv[3])
EOF

    chmod +x "$TEMP_DIR/convert_data.py"
    log_success "数据转换脚本创建完成"
}

# 转换数据格式
convert_data() {
    log_info "转换数据格式..."
    
    local tables=("users" "task_types" "tasks" "points_history" "notifications")
    
    for table in "${tables[@]}"; do
        log_info "转换表: $table"
        
        python3 "$TEMP_DIR/convert_data.py" \
            "$TEMP_DIR/${table}_with_header.csv" \
            "$TEMP_DIR/${table}_converted.csv" \
            "$table"
    done
    
    log_success "数据格式转换完成"
}

# 初始化 PostgreSQL 数据库
init_postgresql() {
    log_info "初始化 PostgreSQL 数据库..."
    
    # 运行初始化脚本
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" \
        -f "./schema/postgresql_init.sql"
    
    log_success "PostgreSQL 数据库初始化完成"
}

# 导入数据到 PostgreSQL
import_data_to_postgresql() {
    log_info "导入数据到 PostgreSQL..."
    
    # 临时禁用外键约束
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" \
        -c "SET session_replication_role = replica;"
    
    # 导入数据（跳过 ID 列，让 SERIAL 自动生成）
    local tables=("task_types" "users" "tasks" "points_history" "notifications")
    
    for table in "${tables[@]}"; do
        log_info "导入表: $table"
        
        # 清空表
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" \
            -c "TRUNCATE TABLE $table RESTART IDENTITY CASCADE;"
        
        # 导入数据
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" \
            -c "\COPY $table FROM '$PWD/$TEMP_DIR/${table}_converted.csv' WITH CSV HEADER;"
    done
    
    # 重新启用外键约束
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" \
        -c "SET session_replication_role = DEFAULT;"
    
    log_success "数据导入完成"
}

# 创建索引
create_indexes() {
    log_info "创建索引..."
    
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" \
        -f "./schema/postgresql_indexes.sql"
    
    log_success "索引创建完成"
}

# 验证数据完整性
verify_data_integrity() {
    log_info "验证数据完整性..."
    
    local tables=("users" "task_types" "tasks" "points_history" "notifications")
    
    for table in "${tables[@]}"; do
        # 获取 MySQL 记录数
        local mysql_count=$(mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" \
            -e "SELECT COUNT(*) FROM $table;" --batch --raw "$MYSQL_DATABASE" | tail -n 1)
        
        # 获取 PostgreSQL 记录数
        local postgres_count=$(PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" \
            -U "$POSTGRES_USER" -d "$POSTGRES_DATABASE" \
            -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
        
        if [ "$mysql_count" -eq "$postgres_count" ]; then
            log_success "表 $table: MySQL($mysql_count) = PostgreSQL($postgres_count)"
        else
            log_error "表 $table: MySQL($mysql_count) ≠ PostgreSQL($postgres_count)"
        fi
    done
}

# 清理临时文件
cleanup() {
    log_info "清理临时文件..."
    rm -rf "$TEMP_DIR"
    log_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "MySQL 到 PostgreSQL 数据迁移脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --backup-only     仅备份 MySQL 数据"
    echo "  --no-cleanup      不清理临时文件"
    echo "  --verify-only     仅验证数据完整性"
    echo "  --help            显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  MYSQL_HOST        MySQL 主机 (默认: localhost)"
    echo "  MYSQL_PORT        MySQL 端口 (默认: 3307)"
    echo "  MYSQL_USER        MySQL 用户名"
    echo "  MYSQL_PASSWORD    MySQL 密码"
    echo "  MYSQL_DATABASE    MySQL 数据库名"
    echo "  POSTGRES_HOST     PostgreSQL 主机 (默认: localhost)"
    echo "  POSTGRES_PORT     PostgreSQL 端口 (默认: 5433)"
    echo "  POSTGRES_USER     PostgreSQL 用户名"
    echo "  POSTGRES_PASSWORD PostgreSQL 密码"
    echo "  POSTGRES_DATABASE PostgreSQL 数据库名"
}

# 主函数
main() {
    local backup_only=false
    local no_cleanup=false
    local verify_only=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup-only)
                backup_only=true
                shift
                ;;
            --no-cleanup)
                no_cleanup=true
                shift
                ;;
            --verify-only)
                verify_only=true
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
    
    log_info "开始 MySQL 到 PostgreSQL 数据迁移"
    
    # 检查依赖
    check_dependencies
    
    # 创建目录
    setup_directories
    
    # 测试连接
    test_connections
    
    if [ "$verify_only" = true ]; then
        verify_data_integrity
        exit 0
    fi
    
    # 备份 MySQL 数据
    backup_mysql_data
    
    if [ "$backup_only" = true ]; then
        log_success "仅备份模式完成"
        exit 0
    fi
    
    # 导出数据
    export_mysql_to_csv
    
    # 创建转换脚本
    create_conversion_script
    
    # 转换数据
    convert_data
    
    # 初始化 PostgreSQL
    init_postgresql
    
    # 导入数据
    import_data_to_postgresql
    
    # 创建索引
    create_indexes
    
    # 验证数据
    verify_data_integrity
    
    # 清理
    if [ "$no_cleanup" = false ]; then
        cleanup
    fi
    
    log_success "数据迁移完成！"
    log_info "请测试应用功能以确保迁移成功"
}

# 执行主函数
main "$@"
