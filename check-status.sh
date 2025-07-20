#!/bin/bash

# KD Family 状态检查脚本
echo "🏠 KD Family 应用状态检查"
echo "================================"

# 检查进程
echo "📋 检查进程状态..."
if ps aux | grep "node server/server.js" | grep -v grep > /dev/null; then
    echo "✅ 应用进程正在运行"
    ps aux | grep "node server/server.js" | grep -v grep | awk '{print "   PID: " $2 " | 启动时间: " $9}'
else
    echo "❌ 应用进程未运行"
    exit 1
fi

echo ""

# 检查端口
echo "🌐 检查端口状态..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ 端口 3000 正常响应"
else
    echo "❌ 端口 3000 无响应"
    exit 1
fi

echo ""

# 检查健康状态
echo "🩺 检查健康状态..."
health_response=$(curl -s http://localhost:3000/api/health)
if [[ $health_response == *"OK"* ]]; then
    echo "✅ 健康检查通过"
    echo "   响应: $health_response"
else
    echo "❌ 健康检查失败"
    echo "   响应: $health_response"
fi

echo ""

# 检查主要界面
echo "🖥️ 检查界面可访问性..."
interfaces=(
    "http://localhost:3000/|主页"
    "http://localhost:3000/welcome.html|欢迎页面"
    "http://localhost:3000/index-modern.html|现代UI"
    "http://localhost:3000/index.html|经典UI"
)

for interface in "${interfaces[@]}"; do
    url=$(echo $interface | cut -d'|' -f1)
    name=$(echo $interface | cut -d'|' -f2)
    
    if curl -s -I "$url" | head -1 | grep -q "200 OK"; then
        echo "✅ $name 可访问"
    else
        echo "❌ $name 不可访问"
    fi
done

echo ""

# 显示访问信息
echo "📱 访问地址信息:"
echo "================================"
echo "🌟 推荐地址（现代UI）:"
echo "   http://localhost:3000/index-modern.html"
echo ""
echo "🏡 其他地址:"
echo "   • 欢迎页面: http://localhost:3000/welcome.html"
echo "   • 经典UI:   http://localhost:3000/index.html"
echo "   • API健康:  http://localhost:3000/api/health"
echo ""
echo "🔧 调试信息:"
echo "   • 应用日志: tail -f app.log"
echo "   • 停止应用: pkill -f \"node server/server.js\""
echo "   • 重启应用: DB_TYPE=sqlite npm start"
echo ""

# 网络检查
echo "🌍 网络检查..."
if command -v ip > /dev/null; then
    local_ip=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null)
    if [ ! -z "$local_ip" ]; then
        echo "   本机IP: $local_ip"
        echo "   局域网访问: http://$local_ip:3000"
    fi
fi

echo ""
echo "✅ 状态检查完成！"

# 如果一切正常，提供下一步建议
echo ""
echo "💡 下一步操作建议:"
echo "   1. 在浏览器中访问: http://localhost:3000/welcome.html"
echo "   2. 选择现代UI界面进行使用"
echo "   3. 如果连接被拒绝，请检查防火墙设置"
echo "   4. 确保使用 http:// 而不是 https://"