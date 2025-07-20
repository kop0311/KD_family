# KD之家 家务积分系统项目结构

## 项目概述
KD之家是一个家庭家务积分管理系统，支持任务分配、积分管理、用户权限管理等功能。

## 技术栈
- **后端**: Node.js + Express + MySQL
- **前端**: 原生HTML/CSS/JavaScript
- **部署**: Docker + docker-compose
- **认证**: JWT Token
- **文件上传**: Multer
- **头像系统**: DiceBear API + 本地上传

## 项目结构
```
KD之家/
├── server.js                 # 主服务器入口文件
├── package.json             # Node.js项目配置
├── docker-compose.yml       # Docker容器编排配置
├── Dockerfile              # Docker镜像构建文件
├── config/
│   └── database.js         # 数据库连接配置
├── database/
│   └── schema.sql          # MySQL数据库表结构
├── middleware/
│   ├── auth.js             # JWT认证中间件
│   └── errorHandler.js     # 错误处理中间件
├── routes/
│   ├── auth.js             # 认证路由 (登录/注册)
│   ├── users.js            # 用户管理路由
│   ├── tasks.js            # 任务管理路由
│   ├── points.js           # 积分管理路由
│   ├── admin.js            # 管理员功能路由
│   └── notifications.js    # 通知功能路由
├── services/
│   └── cronJobs.js         # 定时任务服务
├── uploads/                # 文件上传存储目录
├── client/                 # 前端文件目录
│   ├── index.html          # 主前端页面
│   ├── app.js              # 前端JavaScript逻辑
│   ├── package.json        # 前端包配置
│   └── avatars/            # 本地头像SVG文件
└── CLAUDE.md              # 项目结构文档 (本文件)
```

## 核心功能模块

### 1. 认证系统 (auth.js)
- 用户注册/登录
- JWT Token管理
- 角色权限控制 (advisor/parent/member)

### 2. 用户管理 (users.js)
- 用户资料管理
- 头像上传/选择功能
- DiceBear API集成
- 文件上传处理

### 3. 任务管理 (tasks.js)
- 任务创建、分配、认领
- 任务状态流转 (pending → claimed → in_progress → completed → approved)
- 任务类型管理 (PM/FTL/PA/UBI)

### 4. 积分系统 (points.js)
- 积分记录管理
- 排行榜功能
- 积分历史查询

### 5. 管理功能 (admin.js)
- 系统统计面板
- 用户管理
- 数据概览

## 头像模块详细实现

### 前端功能 (client/app.js: 第5-336行)
**核心功能**:
- DiceBear API集成 (10种头像风格)
- 随机头像生成和展示
- 头像选择和确认工作流
- 本地文件上传和预览
- 图片尺寸调整功能

**关键函数**:
- `openAvatarModal()`: 打开头像选择弹窗
- `loadRandomAvatars()`: 加载10个随机头像
- `selectOnlineAvatar()`: 处理在线头像选择
- `confirmAvatarSelection()`: 确认头像选择
- `handleFileSelect()`: 处理本地文件选择
- `confirmUpload()`: 确认文件上传

### 后端API (routes/users.js: 第148-181行)
**支持双模式**:
1. **在线头像**: 直接保存DiceBear API URL
2. **本地上传**: Multer处理文件存储，返回本地路径

### 事件绑定系统 (client/app.js: 第226-336行)
**完整的事件管理**:
- 模态窗口控制 (关闭按钮、ESC键、点击外部)
- 头像操作按钮 (换一批、确认、取消)
- 文件上传流程 (选择、预览、上传、取消)
- 尺寸调整滑块

## 数据库结构
- **users**: 用户基础信息、角色、头像URL
- **tasks**: 任务信息、状态、分配关系
- **task_types**: 任务类型定义
- **points_history**: 积分变更记录

## 部署信息
- **数据库**: MySQL 8.0 (Docker容器)
- **应用**: Node.js 18 (Docker容器)
- **端口**: 3000 (应用) / 3306 (数据库)
- **存储**: 本地volumes持久化

## 关键修复历史
1. **package.json JSON语法错误**: 移除第26行多余逗号
2. **头像模块全面重构**: 
   - DiceBear API集成替换本地SVG
   - 完整的事件绑定系统
   - 双模式头像选择 (在线/上传)
   - 模态窗口控制优化
   - 文件上传预览和调整功能

## Docker 开发规范
- **命名规则**: 必须使用 `kd-family-{service}-dev` 格式，禁止随机字符串
- **端口映射**: 严格按照 `port_mapping.md` 中的 8xxx 段分配
- **调试端口**: Web(9229), API(9230) 固定不变
- **热重载**: 开发模式必须启用，使用 nodemon + volume 挂载
- **启动检查**: 每次启动前运行 `bash check-docker-compliance.sh`
- **详细规范**: 参考 `docs/docker-dev-rules.md`

## 当前状态
✅ 所有核心功能已实现并测试通过
✅ 头像模块功能完全正常
✅ Docker部署成功
✅ API集成工作正常

访问地址: http://localhost:3000