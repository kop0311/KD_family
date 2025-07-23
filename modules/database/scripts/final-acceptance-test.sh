#!/bin/bash

# 最终验收测试脚本
# 验证 MySQL 到 PostgreSQL 迁移的完整性和功能

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_test() {
    echo -e "${PURPLE}[TEST]${NC} $1"
}

# 全局变量
OVERALL_SUCCESS=true
TEST_RESULTS=()

# 记录测试结果
record_test() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    TEST_RESULTS+=("$test_name|$result|$message")
    
    if [ "$result" = "PASS" ]; then
        log_success "✅ $test_name: $message"
    else
        log_error "❌ $test_name: $message"
        OVERALL_SUCCESS=false
    fi
}

# 检查 PostgreSQL 服务
test_postgresql_service() {
    log_test "检查 PostgreSQL 服务状态"
    
    if docker-compose ps postgres | grep -q "Up"; then
        record_test "PostgreSQL服务" "PASS" "服务正在运行"
    else
        record_test "PostgreSQL服务" "FAIL" "服务未运行"
        return 1
    fi
    
    # 测试连接
    if docker-compose exec postgres pg_isready -U kdfamily_user -d kdfamily >/dev/null 2>&1; then
        record_test "PostgreSQL连接" "PASS" "连接正常"
    else
        record_test "PostgreSQL连接" "FAIL" "连接失败"
        return 1
    fi
}

# 检查数据库结构
test_database_schema() {
    log_test "检查数据库结构"
    
    local expected_tables=("users" "task_types" "tasks" "points_history" "notifications" "user_sessions" "file_uploads")
    
    for table in "${expected_tables[@]}"; do
        if docker-compose exec postgres psql -U kdfamily_user -d kdfamily -c "\dt $table" | grep -q "$table"; then
            record_test "表结构-$table" "PASS" "表存在"
        else
            record_test "表结构-$table" "FAIL" "表不存在"
        fi
    done
    
    # 检查索引
    local index_count=$(docker-compose exec postgres psql -U kdfamily_user -d kdfamily -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" | tr -d ' ')
    
    if [ "$index_count" -gt 20 ]; then
        record_test "数据库索引" "PASS" "找到 $index_count 个索引"
    else
        record_test "数据库索引" "FAIL" "索引数量不足: $index_count"
    fi
}

# 检查数据完整性
test_data_integrity() {
    log_test "检查数据完整性"
    
    # 检查基础数据
    local user_count=$(docker-compose exec postgres psql -U kdfamily_user -d kdfamily -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    local task_type_count=$(docker-compose exec postgres psql -U kdfamily_user -d kdfamily -t -c "SELECT COUNT(*) FROM task_types;" | tr -d ' ')
    
    if [ "$user_count" -gt 0 ]; then
        record_test "用户数据" "PASS" "找到 $user_count 个用户"
    else
        record_test "用户数据" "FAIL" "没有用户数据"
    fi
    
    if [ "$task_type_count" -gt 0 ]; then
        record_test "任务类型数据" "PASS" "找到 $task_type_count 个任务类型"
    else
        record_test "任务类型数据" "FAIL" "没有任务类型数据"
    fi
    
    # 检查外键约束
    local fk_violations=$(docker-compose exec postgres psql -U kdfamily_user -d kdfamily -t -c "
        SELECT COUNT(*) FROM tasks t 
        LEFT JOIN users u ON t.created_by = u.id 
        WHERE u.id IS NULL;
    " | tr -d ' ')
    
    if [ "$fk_violations" -eq 0 ]; then
        record_test "外键完整性" "PASS" "没有外键约束违反"
    else
        record_test "外键完整性" "FAIL" "发现 $fk_violations 个外键约束违反"
    fi
}

# 测试基本功能
test_basic_functionality() {
    log_test "测试基本数据库功能"
    
    # 测试插入操作
    local insert_result=$(docker-compose exec postgres psql -U kdfamily_user -d kdfamily -t -c "
        INSERT INTO notifications (user_id, title, message, type) 
        VALUES (1, '测试通知', '这是一个测试通知', 'system') 
        RETURNING id;
    " 2>/dev/null | tr -d ' ')
    
    if [ -n "$insert_result" ] && [ "$insert_result" != "" ]; then
        record_test "数据插入" "PASS" "成功插入数据，ID: $insert_result"
        
        # 测试查询操作
        local query_result=$(docker-compose exec postgres psql -U kdfamily_user -d kdfamily -t -c "
            SELECT title FROM notifications WHERE id = $insert_result;
        " | tr -d ' ')
        
        if [ "$query_result" = "测试通知" ]; then
            record_test "数据查询" "PASS" "成功查询数据"
        else
            record_test "数据查询" "FAIL" "查询结果不匹配"
        fi
        
        # 测试更新操作
        docker-compose exec postgres psql -U kdfamily_user -d kdfamily -c "
            UPDATE notifications SET is_read = true WHERE id = $insert_result;
        " >/dev/null 2>&1
        
        local update_result=$(docker-compose exec postgres psql -U kdfamily_user -d kdfamily -t -c "
            SELECT is_read FROM notifications WHERE id = $insert_result;
        " | tr -d ' ')
        
        if [ "$update_result" = "t" ]; then
            record_test "数据更新" "PASS" "成功更新数据"
        else
            record_test "数据更新" "FAIL" "更新操作失败"
        fi
        
        # 清理测试数据
        docker-compose exec postgres psql -U kdfamily_user -d kdfamily -c "
            DELETE FROM notifications WHERE id = $insert_result;
        " >/dev/null 2>&1
        
    else
        record_test "数据插入" "FAIL" "插入操作失败"
    fi
}

# 测试性能
test_performance() {
    log_test "测试数据库性能"
    
    # 简单查询性能测试
    local start_time=$(date +%s%N)
    docker-compose exec postgres psql -U kdfamily_user -d kdfamily -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1
    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 )) # 转换为毫秒
    
    if [ "$duration" -lt 1000 ]; then
        record_test "查询性能" "PASS" "查询耗时 ${duration}ms"
    else
        record_test "查询性能" "FAIL" "查询耗时过长: ${duration}ms"
    fi
    
    # 复杂查询性能测试
    start_time=$(date +%s%N)
    docker-compose exec postgres psql -U kdfamily_user -d kdfamily -c "
        SELECT u.username, COUNT(t.id) as task_count
        FROM users u
        LEFT JOIN tasks t ON u.id = t.assigned_to
        GROUP BY u.id, u.username
        LIMIT 10;
    " >/dev/null 2>&1
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$duration" -lt 2000 ]; then
        record_test "复杂查询性能" "PASS" "复杂查询耗时 ${duration}ms"
    else
        record_test "复杂查询性能" "FAIL" "复杂查询耗时过长: ${duration}ms"
    fi
}

# 测试事务支持
test_transaction_support() {
    log_test "测试事务支持"
    
    # 测试事务回滚
    local transaction_test=$(docker-compose exec postgres psql -U kdfamily_user -d kdfamily -c "
        BEGIN;
        INSERT INTO notifications (user_id, title, message, type) VALUES (1, '事务测试', '这应该被回滚', 'system');
        ROLLBACK;
        SELECT COUNT(*) FROM notifications WHERE title = '事务测试';
    " 2>/dev/null | tail -n 3 | head -n 1 | tr -d ' ')
    
    if [ "$transaction_test" = "0" ]; then
        record_test "事务回滚" "PASS" "事务回滚正常工作"
    else
        record_test "事务回滚" "FAIL" "事务回滚失败"
    fi
    
    # 测试事务提交
    docker-compose exec postgres psql -U kdfamily_user -d kdfamily -c "
        BEGIN;
        INSERT INTO notifications (user_id, title, message, type) VALUES (1, '事务提交测试', '这应该被提交', 'system');
        COMMIT;
    " >/dev/null 2>&1
    
    local commit_test=$(docker-compose exec postgres psql -U kdfamily_user -d kdfamily -t -c "
        SELECT COUNT(*) FROM notifications WHERE title = '事务提交测试';
    " | tr -d ' ')
    
    if [ "$commit_test" = "1" ]; then
        record_test "事务提交" "PASS" "事务提交正常工作"
        
        # 清理测试数据
        docker-compose exec postgres psql -U kdfamily_user -d kdfamily -c "
            DELETE FROM notifications WHERE title = '事务提交测试';
        " >/dev/null 2>&1
    else
        record_test "事务提交" "FAIL" "事务提交失败"
    fi
}

# 检查应用配置
test_application_config() {
    log_test "检查应用配置"
    
    # 检查数据库配置文件
    if [ -f "config/database.js" ]; then
        if grep -q "pg" config/database.js && grep -q "Pool" config/database.js; then
            record_test "数据库配置" "PASS" "PostgreSQL 配置正确"
        else
            record_test "数据库配置" "FAIL" "数据库配置不正确"
        fi
    else
        record_test "数据库配置" "FAIL" "数据库配置文件不存在"
    fi
    
    # 检查环境变量
    if [ -f ".env.example" ]; then
        if grep -q "postgresql://" .env.example; then
            record_test "环境变量配置" "PASS" "PostgreSQL 环境变量配置正确"
        else
            record_test "环境变量配置" "FAIL" "环境变量配置不正确"
        fi
    else
        record_test "环境变量配置" "FAIL" "环境变量示例文件不存在"
    fi
}

# 检查清理状态
test_cleanup_status() {
    log_test "检查 MySQL 清理状态"
    
    # 检查 MySQL 容器是否已停止
    if ! docker ps | grep -q mysql; then
        record_test "MySQL容器清理" "PASS" "MySQL 容器已停止"
    else
        record_test "MySQL容器清理" "FAIL" "MySQL 容器仍在运行"
    fi
    
    # 检查 MySQL 数据卷是否已删除
    if ! docker volume ls | grep -q mysql_data; then
        record_test "MySQL数据卷清理" "PASS" "MySQL 数据卷已删除"
    else
        record_test "MySQL数据卷清理" "FAIL" "MySQL 数据卷仍存在"
    fi
    
    # 检查备份文件是否存在
    if [ -d "./migration_backup" ] && [ "$(ls -A ./migration_backup)" ]; then
        record_test "数据备份" "PASS" "迁移备份文件存在"
    else
        record_test "数据备份" "FAIL" "迁移备份文件不存在"
    fi
}

# 生成测试报告
generate_report() {
    log_info "生成测试报告..."
    
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="./migration_backup/acceptance_test_report_$(date +%s).txt"
    
    cat > "$report_file" << EOF
# MySQL 到 PostgreSQL 迁移验收测试报告

## 测试信息
- 测试时间: $timestamp
- 测试环境: $(uname -s) $(uname -r)
- Docker 版本: $(docker --version)

## 测试结果摘要
EOF

    local total_tests=${#TEST_RESULTS[@]}
    local passed_tests=0
    local failed_tests=0
    
    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r test_name status message <<< "$result"
        if [ "$status" = "PASS" ]; then
            ((passed_tests++))
        else
            ((failed_tests++))
        fi
    done
    
    cat >> "$report_file" << EOF
- 总测试数: $total_tests
- 通过测试: $passed_tests
- 失败测试: $failed_tests
- 成功率: $(( passed_tests * 100 / total_tests ))%

## 详细测试结果
EOF

    for result in "${TEST_RESULTS[@]}"; do
        IFS='|' read -r test_name status message <<< "$result"
        echo "- [$status] $test_name: $message" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

## 总结
EOF

    if [ "$OVERALL_SUCCESS" = true ]; then
        echo "✅ 所有测试通过！MySQL 到 PostgreSQL 迁移成功完成。" >> "$report_file"
    else
        echo "❌ 部分测试失败。请检查失败的测试项并进行修复。" >> "$report_file"
    fi
    
    log_success "测试报告已保存: $report_file"
}

# 显示帮助信息
show_help() {
    echo "MySQL 到 PostgreSQL 迁移验收测试脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --quick       快速测试（跳过性能测试）"
    echo "  --help        显示帮助信息"
    echo ""
    echo "此脚本将验证:"
    echo "  - PostgreSQL 服务状态"
    echo "  - 数据库结构完整性"
    echo "  - 数据完整性"
    echo "  - 基本功能"
    echo "  - 性能表现"
    echo "  - 事务支持"
    echo "  - 应用配置"
    echo "  - 清理状态"
}

# 主函数
main() {
    local quick_test=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick)
                quick_test=true
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
    
    echo "🎯 开始 MySQL 到 PostgreSQL 迁移验收测试"
    echo "================================================"
    
    # 执行测试
    test_postgresql_service
    test_database_schema
    test_data_integrity
    test_basic_functionality
    
    if [ "$quick_test" = false ]; then
        test_performance
    fi
    
    test_transaction_support
    test_application_config
    test_cleanup_status
    
    # 生成报告
    generate_report
    
    echo ""
    echo "================================================"
    
    if [ "$OVERALL_SUCCESS" = true ]; then
        log_success "🎉 所有验收测试通过！迁移成功完成！"
        echo ""
        echo "📋 下一步建议:"
        echo "  1. 启动完整应用进行功能测试"
        echo "  2. 运行完整的测试套件"
        echo "  3. 进行用户验收测试"
        echo "  4. 更新生产部署文档"
        exit 0
    else
        log_error "❌ 部分验收测试失败，请检查并修复问题"
        exit 1
    fi
}

# 执行主函数
main "$@"
