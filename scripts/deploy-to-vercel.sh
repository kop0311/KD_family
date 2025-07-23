#!/bin/bash

# KD Family 一键部署到Vercel脚本
# 自动配置环境变量并部署

set -e

echo "🚀 KD Family 一键部署脚本"
echo "=========================="

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
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    log_success "Node.js: $(node --version)"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    log_success "npm: $(npm --version)"
    
    # 检查或安装Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI 未安装，正在安装..."
        npm install -g vercel
    fi
    log_success "Vercel CLI: $(vercel --version)"
}

# 检查Vercel登录状态
check_vercel_auth() {
    log_info "检查Vercel登录状态..."
    
    if ! vercel whoami &> /dev/null; then
        log_warning "未登录Vercel，请登录..."
        vercel login
    fi
    
    local user=$(vercel whoami)
    log_success "已登录Vercel: $user"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 安装依赖
    log_info "安装依赖..."
    npm install
    
    # 运行构建
    log_info "运行生产构建..."
    npm run build
    
    log_success "项目构建完成"
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    
    # 预设配置
    local JWT_SECRET="ZcL1ndn1c2fEGTPZuj3JD0CCRV/MZRvIi5vfXQiK7GbeQ/IUyEG/jNOhV3LYfhqqlx43G3EHFPMB9YkKG+FmsQ=="
    local SUPABASE_REF="pjnqbsnmrfhkyhoqfekv"
    
    # 获取数据库密码
    echo ""
    log_info "Supabase配置信息:"
    echo "项目引用: $SUPABASE_REF"
    echo "项目URL: https://$SUPABASE_REF.supabase.co"
    echo ""
    
    read -p "请输入Supabase数据库密码: " -s DB_PASSWORD
    echo ""
    
    if [ -z "$DB_PASSWORD" ]; then
        log_error "数据库密码不能为空"
        exit 1
    fi
    
    # 构建数据库URL
    local DATABASE_URL="postgresql://postgres.$SUPABASE_REF:$DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    
    # 设置环境变量
    log_info "设置Vercel环境变量..."
    
    # 删除现有变量（忽略错误）
    vercel env rm JWT_SECRET production --yes 2>/dev/null || true
    vercel env rm JWT_SECRET preview --yes 2>/dev/null || true
    vercel env rm JWT_SECRET development --yes 2>/dev/null || true
    
    vercel env rm DATABASE_URL production --yes 2>/dev/null || true
    vercel env rm DATABASE_URL preview --yes 2>/dev/null || true
    vercel env rm DATABASE_URL development --yes 2>/dev/null || true
    
    # 添加新变量
    echo "$JWT_SECRET" | vercel env add JWT_SECRET production
    echo "$JWT_SECRET" | vercel env add JWT_SECRET preview
    echo "$JWT_SECRET" | vercel env add JWT_SECRET development
    
    echo "$DATABASE_URL" | vercel env add DATABASE_URL production
    echo "$DATABASE_URL" | vercel env add DATABASE_URL preview
    echo "$DATABASE_URL" | vercel env add DATABASE_URL development
    
    log_success "环境变量配置完成"
}

# 部署到Vercel
deploy_to_vercel() {
    log_info "部署到Vercel..."

    # 验证vercel.json配置
    if [ -f "vercel.json" ]; then
        log_info "验证vercel.json配置..."
        # 简单的JSON语法检查
        if ! node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8'))" 2>/dev/null; then
            log_error "vercel.json配置文件格式错误"
            exit 1
        fi
        log_success "vercel.json配置验证通过"
    fi

    # 部署到生产环境
    log_info "开始部署到生产环境..."
    vercel --prod --yes

    log_success "部署完成！"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    local app_url="https://kd-family.vercel.app"
    
    echo ""
    log_success "🎉 部署成功！"
    echo ""
    echo "📋 部署信息:"
    echo "应用URL: $app_url"
    echo "测试数据库: $app_url/api/test-db"
    echo "登录页面: $app_url/login"
    echo ""
    echo "🔍 验证步骤:"
    echo "1. 访问 $app_url/api/test-db 检查数据库连接"
    echo "2. 访问 $app_url/login 测试注册功能"
    echo "3. 注册新用户并测试登录"
    echo ""
    echo "📚 管理面板:"
    echo "Vercel Dashboard: https://vercel.com/dashboard"
    echo "Supabase Dashboard: https://supabase.com/dashboard/project/$SUPABASE_REF"
}

# 主函数
main() {
    echo ""
    log_info "开始KD Family自动部署流程..."
    echo ""
    
    check_dependencies
    check_vercel_auth
    build_project
    setup_environment
    deploy_to_vercel
    verify_deployment
    
    echo ""
    log_success "🎉 KD Family部署完成！"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查上面的错误信息"; exit 1' ERR

# 运行主函数
main
