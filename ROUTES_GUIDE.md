# 🏡 KD之家 - 页面路由指南

## 📍 主要访问路径

### 🏠 用户前台
- **`/`** - 默认首页 (index-modern.html)
  - 现代化设计的主要用户界面
  - 家庭任务管理功能
  - 积分系统和排行榜

### 🔧 管理后台
- **`/admin`** - 管理后台入口 (admin-enhanced.html)
  - 完整的家庭管理功能
  - 用户管理、任务管理
  - 数据分析和系统配置

- **`/admin-preview`** - 管理后台预览 (admin-preview.html)
  - 功能演示和界面预览
  - 适合展示用途

## 🎨 备选页面路径

### 🎯 用户界面变体
- **`/classic`** - 经典版界面 (index.html)
  - 原始设计版本
  - 基础功能实现

- **`/modern-v2`** - 现代版V2 (index-modern-v2.html)
  - 蓝色主题设计
  - 专业版界面风格

- **`/welcome`** - 欢迎页面 (welcome.html)
  - 项目介绍和功能说明

### 🛠️ 管理界面变体
- **`/admin-classic`** - 经典管理后台 (admin-dashboard.html)
  - 原始管理界面
  - 基础管理功能

## 🔗 API端点
- **`/api/health`** - 系统健康检查
- **`/api/auth/*`** - 用户认证相关
- **`/api/users/*`** - 用户管理
- **`/api/tasks/*`** - 任务管理
- **`/api/points/*`** - 积分系统
- **`/api/admin/*`** - 管理功能

## 📱 推荐使用

### 日常使用
1. **主页**: `/` - 家庭成员日常使用
2. **管理**: `/admin` - 管理员使用

### 开发测试
1. **预览**: `/admin-preview` - 展示管理功能
2. **备选**: `/classic` `/modern-v2` - 不同设计风格

## 🎨 设计主题

### 🏡 家庭主题 (推荐)
- 主页: `/` (index-modern.html)
- 管理: `/admin` (admin-enhanced.html)
- **特色**: 温馨橙色主题，家庭友好设计

### 💙 专业主题
- 主页: `/modern-v2` (index-modern-v2.html)
- **特色**: 蓝色商务主题，专业感强

### 🎯 经典主题
- 主页: `/classic` (index.html)
- 管理: `/admin-classic` (admin-dashboard.html)
- **特色**: 传统设计，功能导向

## 🚀 生产环境

在生产环境中：
- 所有未匹配的路径将重定向到主页 (`/`)
- 静态资源通过Express.static提供服务
- API路径保持不变

## 📝 开发说明

### 添加新页面
1. 将HTML文件放在 `public/` 目录
2. 在 `server/server.js` 中添加路由规则
3. 更新本文档

### 修改默认页面
在 `server/server.js` 第100行修改默认路由:
```javascript
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'your-page.html'));
});
```

---

🏡 **KD之家** - 让每个家庭都拥有温馨的任务管理体验！