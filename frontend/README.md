# KD Family Frontend

现代化的KD Family前端应用，使用React + TypeScript + Vite构建。

## 🚀 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand
- **路由**: React Router v6
- **UI样式**: Tailwind CSS
- **组件库**: Headless UI + Radix UI
- **表单处理**: React Hook Form + Zod
- **HTTP客户端**: Axios + TanStack Query
- **动画**: Framer Motion
- **通知**: React Hot Toast
- **测试**: Vitest + Testing Library + Playwright
- **代码质量**: ESLint + Prettier + Husky

## 📦 安装依赖

推荐使用 pnpm：

```bash
pnpm install
```

或使用 npm：

```bash
npm install
```

## 🛠️ 开发

启动开发服务器：

```bash
pnpm dev
```

应用将在 http://localhost:5173 启动

## 🏗️ 构建

构建生产版本：

```bash
pnpm build
```

预览构建结果：

```bash
pnpm preview
```

## 🧪 测试

运行单元测试：

```bash
pnpm test
```

运行测试并显示UI：

```bash
pnpm test:ui
```

运行测试覆盖率：

```bash
pnpm test:coverage
```

运行E2E测试：

```bash
pnpm test:e2e
```

## 📝 代码质量

运行ESLint检查：

```bash
pnpm lint
```

自动修复ESLint问题：

```bash
pnpm lint:fix
```

格式化代码：

```bash
pnpm format
```

检查代码格式：

```bash
pnpm format:check
```

TypeScript类型检查：

```bash
pnpm type-check
```

## 📚 Storybook

启动Storybook：

```bash
pnpm storybook
```

构建Storybook：

```bash
pnpm build-storybook
```

## 🏗️ 项目结构

```
src/
├── components/          # 可复用组件
│   ├── ui/             # 基础UI组件
│   ├── layout/         # 布局组件
│   └── auth/           # 认证相关组件
├── pages/              # 页面组件
├── hooks/              # 自定义Hooks
├── services/           # API服务
├── store/              # 状态管理
├── types/              # TypeScript类型定义
├── utils/              # 工具函数
├── styles/             # 全局样式
├── assets/             # 静态资源
└── test/               # 测试配置
```

## 🎨 设计系统

项目使用基于Tailwind CSS的设计系统：

- **主色调**: 橙色 (#f97316)
- **辅助色**: 蓝色 (#0ea5e9)
- **字体**: Inter (主要) + Outfit (标题)
- **设计风格**: 玻璃拟态 + 现代渐变

## 🔧 开发规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier配置
- 组件使用函数式组件 + Hooks
- 状态管理使用Zustand
- API调用使用TanStack Query
- 表单使用React Hook Form + Zod验证
- 样式使用Tailwind CSS类名

## 🚀 部署

项目构建后的文件在 `dist` 目录，可以部署到任何静态文件服务器。

确保服务器配置支持SPA路由（所有路由都指向index.html）。

## 🤝 贡献

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 📄 许可证

MIT License
