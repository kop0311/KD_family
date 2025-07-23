#!/bin/bash

# KD Family Vercel Environment Variables Setup Script
# 自动配置Vercel环境变量

set -e

echo "🚀 KD Family Vercel 环境变量配置脚本"
echo "======================================"

# 检查是否安装了Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "请先安装: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI 已安装"

# 检查是否已登录Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 请先登录Vercel..."
    vercel login
fi

echo "✅ Vercel 已登录"

# 获取项目信息
echo ""
echo "📋 请提供以下信息："

# JWT Secret (已提供)
JWT_SECRET="ZcL1ndn1c2fEGTPZuj3JD0CCRV/MZRvIi5vfXQiK7GbeQ/IUyEG/jNOhV3LYfhqqlx43G3EHFPMB9YkKG+FmsQ=="
echo "✅ JWT_SECRET: 已设置"

# 获取数据库连接信息
echo ""
echo "🗄️  Supabase 数据库配置："
echo "项目引用: pjnqbsnmrfhkyhoqfekv"
echo ""

read -p "请输入你的Supabase数据库密码: " -s DB_PASSWORD
echo ""

# 构建数据库URL (使用连接池)
DATABASE_URL="postgresql://postgres.pjnqbsnmrfhkyhoqfekv:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo ""
echo "🔧 配置环境变量..."

# 设置环境变量
echo "设置 JWT_SECRET..."
vercel env add JWT_SECRET production <<< "$JWT_SECRET"
vercel env add JWT_SECRET preview <<< "$JWT_SECRET"
vercel env add JWT_SECRET development <<< "$JWT_SECRET"

echo "设置 DATABASE_URL..."
vercel env add DATABASE_URL production <<< "$DATABASE_URL"
vercel env add DATABASE_URL preview <<< "$DATABASE_URL"
vercel env add DATABASE_URL development <<< "$DATABASE_URL"

echo "设置 NODE_ENV..."
vercel env add NODE_ENV production <<< "production"

echo ""
echo "✅ 环境变量配置完成！"
echo ""
echo "📋 已配置的环境变量："
echo "- JWT_SECRET: ✅"
echo "- DATABASE_URL: ✅"
echo "- NODE_ENV: ✅"
echo ""
echo "🚀 下一步："
echo "1. 运行: vercel --prod"
echo "2. 或者推送代码触发自动部署"
echo ""
echo "🔍 验证部署："
echo "访问: https://kd-family.vercel.app/api/test-db"
echo ""
echo "🎉 配置完成！"
