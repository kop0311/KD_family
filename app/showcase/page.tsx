'use client';

import React from 'react';
import { ButtonShadcn } from '@/components/ui/button-shadcn';
import {
  CardShadcn,
  CardHeaderShadcn,
  CardContentShadcn,
  CardFooterShadcn,
  CardTitle,
  CardDescription,
  StatsCardShadcn
} from '@/components/ui/card-shadcn';
import { InputShadcn } from '@/components/ui/input-shadcn';
import {
  SelectShadcn,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select-shadcn';
import { BadgeShadcn } from '@/components/ui/badge-shadcn';
import { ProgressShadcn } from '@/components/ui/progress-shadcn';
import { AvatarShadcn, AvatarImageShadcn, AvatarFallbackShadcn, AvatarWithStatus } from '@/components/ui/avatar-shadcn';
import {
  UserIcon,
  StarIcon,
  TrophyIcon,
  SearchIcon,
  MailIcon,
  LockIcon
} from 'lucide-react';

export default function ShowcasePage() {
  const [inputValue, setInputValue] = React.useState('');
  const [selectValue, setSelectValue] = React.useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            KD Family UI Showcase
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            优化后的 shadcn/ui 组件展示
          </p>
          <BadgeShadcn variant="success" className="text-sm">
            ✨ 性能优化 + 现代设计
          </BadgeShadcn>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatsCardShadcn
            title="总任务完成"
            value="1,234"
            change={{ value: '+12%', type: 'increase' }}
            icon={<TrophyIcon className="w-8 h-8" />}
          />
          <StatsCardShadcn
            title="活跃用户"
            value="156"
            change={{ value: '+5%', type: 'increase' }}
            icon={<UserIcon className="w-8 h-8" />}
          />
          <StatsCardShadcn
            title="平均评分"
            value="4.8"
            change={{ value: '0.0', type: 'neutral' }}
            icon={<StarIcon className="w-8 h-8" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Buttons Section */}
          <CardShadcn variant="glass">
            <CardHeaderShadcn>
              <CardTitle className="text-white">按钮组件</CardTitle>
              <CardDescription>不同样式和状态的按钮</CardDescription>
            </CardHeaderShadcn>
            <CardContentShadcn>
              <div className="grid grid-cols-2 gap-4">
                <ButtonShadcn variant="default">默认按钮</ButtonShadcn>
                <ButtonShadcn variant="secondary">次要按钮</ButtonShadcn>
                <ButtonShadcn variant="outline">边框按钮</ButtonShadcn>
                <ButtonShadcn variant="ghost">幽灵按钮</ButtonShadcn>
                <ButtonShadcn variant="destructive">危险按钮</ButtonShadcn>
                <ButtonShadcn variant="glass">玻璃按钮</ButtonShadcn>
                <ButtonShadcn loading disabled>
                  加载中...
                </ButtonShadcn>
                <ButtonShadcn size="sm">小按钮</ButtonShadcn>
              </div>
            </CardContentShadcn>
          </CardShadcn>

          {/* Form Components */}
          <CardShadcn variant="glass">
            <CardHeaderShadcn>
              <CardTitle className="text-white">表单组件</CardTitle>
              <CardDescription>输入框和选择器</CardDescription>
            </CardHeaderShadcn>
            <CardContentShadcn>
              <div className="space-y-4">
                <InputShadcn
                  label="用户名"
                  placeholder="请输入用户名"
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />

                <InputShadcn
                  label="搜索"
                  placeholder="搜索内容..."
                  leftIcon={<SearchIcon className="w-4 h-4" />}
                  variant="glass"
                />

                <InputShadcn
                  label="邮箱"
                  type="email"
                  placeholder="your@email.com"
                  leftIcon={<MailIcon className="w-4 h-4" />}
                  error="邮箱格式不正确"
                />

                <InputShadcn
                  label="密码"
                  type="password"
                  placeholder="请输入密码"
                  leftIcon={<LockIcon className="w-4 h-4" />}
                  showPasswordToggle
                />

                <SelectShadcn value={selectValue} onValueChange={setSelectValue}>
                  <SelectTrigger
                    label="选择角色"
                    variant="glass"
                  >
                    <SelectValue placeholder="请选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="user">普通用户</SelectItem>
                    <SelectItem value="guest">访客</SelectItem>
                  </SelectContent>
                </SelectShadcn>
              </div>
            </CardContentShadcn>
          </CardShadcn>

          {/* Badges and Progress */}
          <CardShadcn variant="glass">
            <CardHeaderShadcn>
              <CardTitle className="text-white">标签和进度</CardTitle>
              <CardDescription>状态标签和进度条</CardDescription>
            </CardHeaderShadcn>
            <CardContentShadcn>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">状态标签</h4>
                  <div className="flex flex-wrap gap-2">
                    <BadgeShadcn variant="default">默认</BadgeShadcn>
                    <BadgeShadcn variant="secondary">次要</BadgeShadcn>
                    <BadgeShadcn variant="success">成功</BadgeShadcn>
                    <BadgeShadcn variant="warning">警告</BadgeShadcn>
                    <BadgeShadcn variant="destructive">错误</BadgeShadcn>
                    <BadgeShadcn variant="outline">边框</BadgeShadcn>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-white mb-3">进度条</h4>
                  <div className="space-y-4">
                    <ProgressShadcn
                      value={75}
                      label="任务完成度"
                      showValue
                    />
                    <ProgressShadcn
                      value={60}
                      variant="success"
                      size="lg"
                      showValue
                    />
                    <ProgressShadcn
                      value={30}
                      variant="warning"
                      label="警告级别"
                    />
                    <ProgressShadcn
                      value={85}
                      variant="danger"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </CardContentShadcn>
          </CardShadcn>

          {/* Avatars */}
          <CardShadcn variant="glass">
            <CardHeaderShadcn>
              <CardTitle className="text-white">头像组件</CardTitle>
              <CardDescription>用户头像和状态指示器</CardDescription>
            </CardHeaderShadcn>
            <CardContentShadcn>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">基础头像</h4>
                  <div className="flex items-center gap-4">
                    <AvatarShadcn size="sm">
                      <AvatarImageShadcn src="/api/placeholder/32/32" alt="User" />
                      <AvatarFallbackShadcn>KD</AvatarFallbackShadcn>
                    </AvatarShadcn>
                    <AvatarShadcn size="md">
                      <AvatarImageShadcn src="/api/placeholder/40/40" alt="User" />
                      <AvatarFallbackShadcn>张三</AvatarFallbackShadcn>
                    </AvatarShadcn>
                    <AvatarShadcn size="lg">
                      <AvatarImageShadcn src="/api/placeholder/48/48" alt="User" />
                      <AvatarFallbackShadcn>李四</AvatarFallbackShadcn>
                    </AvatarShadcn>
                    <AvatarShadcn size="xl">
                      <AvatarImageShadcn src="/api/placeholder/56/56" alt="User" />
                      <AvatarFallbackShadcn>王五</AvatarFallbackShadcn>
                    </AvatarShadcn>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-white mb-3">状态头像</h4>
                  <div className="flex items-center gap-4">
                    <AvatarWithStatus status="online" showStatus>
                      <AvatarImageShadcn src="/api/placeholder/40/40" alt="Online User" />
                      <AvatarFallbackShadcn>在线</AvatarFallbackShadcn>
                    </AvatarWithStatus>
                    <AvatarWithStatus status="away" showStatus>
                      <AvatarImageShadcn src="/api/placeholder/40/40" alt="Away User" />
                      <AvatarFallbackShadcn>离开</AvatarFallbackShadcn>
                    </AvatarWithStatus>
                    <AvatarWithStatus status="busy" showStatus>
                      <AvatarImageShadcn src="/api/placeholder/40/40" alt="Busy User" />
                      <AvatarFallbackShadcn>忙碌</AvatarFallbackShadcn>
                    </AvatarWithStatus>
                    <AvatarWithStatus status="offline" showStatus>
                      <AvatarImageShadcn src="/api/placeholder/40/40" alt="Offline User" />
                      <AvatarFallbackShadcn>离线</AvatarFallbackShadcn>
                    </AvatarWithStatus>
                  </div>
                </div>
              </div>
            </CardContentShadcn>
          </CardShadcn>

          {/* Performance Benefits */}
          <CardShadcn variant="glass" className="lg:col-span-2">
            <CardHeaderShadcn>
              <CardTitle className="text-white">性能优化特性</CardTitle>
              <CardDescription>shadcn/ui 带来的性能提升</CardDescription>
            </CardHeaderShadcn>
            <CardContentShadcn>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">50%</div>
                  <div className="text-sm text-muted-foreground">Bundle Size 减少</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tree-shaking 优化
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">30%</div>
                  <div className="text-sm text-muted-foreground">渲染性能提升</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    React.memo 优化
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">100%</div>
                  <div className="text-sm text-muted-foreground">类型安全</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    完整 TypeScript 支持
                  </div>
                </div>
              </div>
            </CardContentShadcn>
            <CardFooterShadcn>
              <div className="w-full text-center">
                <ButtonShadcn variant="outline" className="mr-4">
                  查看源码
                </ButtonShadcn>
                <ButtonShadcn>
                  开始使用
                </ButtonShadcn>
              </div>
            </CardFooterShadcn>
          </CardShadcn>
        </div>
      </div>
    </div>
  );
}
