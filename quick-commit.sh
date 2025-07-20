#!/bin/bash

# KD Family 快速提交脚本
# 用法: ./quick-commit.sh "提交信息"

# 检查是否提供了提交信息
if [ -z "$1" ]; then
    echo "❌ 错误: 请提供提交信息"
    echo "用法: ./quick-commit.sh \"feat: 添加新功能\""
    exit 1
fi

# 显示当前状态
echo "📊 检查Git状态..."
git status --short

# 确认是否继续
echo ""
read -p "🤔 是否继续提交这些变更? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ 取消提交"
    exit 0
fi

# 执行Git操作
echo ""
echo "📦 添加文件..."
git add .

echo "💾 提交变更..."
git commit -m "$1"

if [ $? -eq 0 ]; then
    echo "🚀 推送到GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ 代码已成功提交并推送到GitHub!"
        echo "📝 提交信息: $1"
        echo "🔗 查看: https://github.com/kop0311/KD_family"
    else
        echo "❌ 推送失败，请检查网络连接"
    fi
else
    echo "❌ 提交失败，请检查错误信息"
fi
