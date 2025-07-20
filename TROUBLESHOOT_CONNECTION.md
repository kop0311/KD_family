# 🔧 连接问题排查指南

## 📊 当前状态确认

✅ **应用服务状态**: 正常运行 (PID: 进程已启动)
✅ **端口监听**: 3000端口正常响应
✅ **API健康检查**: `/api/health` 正常返回
✅ **静态文件服务**: HTML/CSS/JS文件正常提供
✅ **数据库连接**: SQLite数据库正常工作

## 🚨 "localhost 拒绝连接" 解决方案

### 1. 基础检查

```bash
# 确认应用正在运行
./check-status.sh

# 或手动检查
curl http://localhost:3000/api/health
```

### 2. 浏览器访问排查

**步骤1: 确认使用正确的协议**
- ✅ **正确**: `http://localhost:3000`
- ❌ **错误**: `https://localhost:3000` (会被拒绝)

**步骤2: 尝试不同的访问地址**
```
1. http://localhost:3000/welcome.html     (推荐入口)
2. http://localhost:3000/index-modern.html (现代UI)
3. http://localhost:3000/index.html        (经典UI)
4. http://127.0.0.1:3000/welcome.html      (替代地址)
```

**步骤3: 清除浏览器缓存**
- Chrome: Ctrl+Shift+R 或 F12 → Network → Disable cache
- Firefox: Ctrl+Shift+R 或清除缓存
- Safari: Command+Option+R

### 3. 网络配置检查

**检查防火墙设置**
```bash
# Linux/Ubuntu
sudo ufw status
sudo ufw allow 3000

# Windows
# 检查Windows防火墙是否阻止了3000端口

# macOS
# 检查系统偏好设置 → 安全性与隐私 → 防火墙
```

**检查端口占用**
```bash
# 确认3000端口没有被其他服务占用
lsof -i :3000
netstat -tulpn | grep 3000
```

### 4. 常见问题解决

**问题1: 浏览器缓存**
```
解决: 强制刷新 (Ctrl+Shift+R) 或清除浏览器缓存
```

**问题2: 代理设置**
```
解决: 检查浏览器代理设置，确保localhost不走代理
```

**问题3: 安全软件拦截**
```
解决: 检查杀毒软件、防火墙是否拦截了Node.js应用
```

**问题4: 端口被占用**
```bash
# 停止占用端口的其他进程
pkill -f "node server/server.js"
# 重新启动应用
DB_TYPE=sqlite npm start
```

### 5. 替代访问方法

**方法1: 使用其他端口**
```bash
# 停止当前应用
pkill -f "node server/server.js"

# 使用其他端口启动
PORT=3001 DB_TYPE=sqlite npm start

# 访问: http://localhost:3001/welcome.html
```

**方法2: 使用Docker环境**
```bash
# 启动Docker环境
./docker/manage.sh start

# 访问: http://localhost:3000/welcome.html
```

**方法3: 检查网络配置**
```bash
# 获取本机IP
ip route get 1 | awk '{print $7; exit}'

# 使用IP访问（如果显示如192.168.1.100）
# http://192.168.1.100:3000/welcome.html
```

## 🧪 测试验证

运行以下命令验证连接：

```bash
# 1. API测试
curl -v http://localhost:3000/api/health

# 2. 页面测试
curl -I http://localhost:3000/welcome.html

# 3. 完整状态检查
./check-status.sh
```

## 📱 访问地址指南

### 推荐访问顺序
1. **首选**: http://localhost:3000/welcome.html
2. **现代UI**: http://localhost:3000/index-modern.html  
3. **经典UI**: http://localhost:3000/index.html
4. **API状态**: http://localhost:3000/api/health

### 功能说明
- **welcome.html**: 界面选择页面，帮助用户选择合适的UI
- **index-modern.html**: 现代化设计，包含完整功能
- **index.html**: 传统界面，基础功能
- **API endpoints**: 后端接口，支持所有数据操作

## 🔍 深度排查

如果上述方法都无效，请运行详细诊断：

```bash
# 详细网络诊断
echo "=== 网络诊断报告 ==="
echo "主机名: $(hostname)"
echo "当前用户: $(whoami)"
echo "操作系统: $(uname -a)"
echo ""

echo "=== 端口监听状态 ==="
ss -tlnp | grep 3000 || netstat -tlnp | grep 3000
echo ""

echo "=== 进程状态 ==="
ps aux | grep "node server/server.js" | grep -v grep
echo ""

echo "=== 防火墙状态 ==="
sudo ufw status 2>/dev/null || echo "无法检查ufw状态"
echo ""

echo "=== 网络连接测试 ==="
curl -v http://localhost:3000/api/health 2>&1
echo ""

echo "=== DNS解析测试 ==="
nslookup localhost
echo ""
```

## 💡 成功访问后的下一步

1. **首次使用**: 访问 http://localhost:3000/welcome.html
2. **选择界面**: 推荐选择"现代UI"获得最佳体验
3. **创建账户**: 注册新用户账户
4. **探索功能**: 任务管理、积分系统、排行榜等

## 🆘 获取支持

如果问题仍然存在：

1. **收集信息**:
   ```bash
   ./check-status.sh > debug-info.txt
   curl -v http://localhost:3000/api/health >> debug-info.txt 2>&1
   ```

2. **提供详细信息**:
   - 操作系统版本
   - 浏览器类型和版本
   - 错误消息截图
   - debug-info.txt 文件内容

---

## ✅ 快速验证清单

- [ ] 应用进程正在运行
- [ ] 使用 `http://` 而不是 `https://`
- [ ] 端口3000没有被其他程序占用
- [ ] 防火墙允许3000端口
- [ ] 浏览器没有代理设置干扰
- [ ] 清除了浏览器缓存
- [ ] 尝试了不同的浏览器

**记住**: 服务器运行正常，问题通常在客户端配置！