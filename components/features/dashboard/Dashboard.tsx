'use client';

import React, { useState } from 'react';
import {
  Card,
  StatsCard,
  Button,
  Modal,
  Badge,
  ThemeToggle,
  Input
} from '@/components/ui';
import { Avatar } from '@/components/optimization/LazyImage';
import { ScrollAnimation, HoverAnimation, TypingAnimation, FloatingActionButton } from '@/components/animations/AnimationComponents';
import { ResponsiveGrid, ResponsiveText, useBreakpoint } from '@/components/responsive/ResponsiveGrid';
import { AccessibleBreadcrumb } from '@/components/accessibility/AccessibleComponents';
import { AccessibilityPanel, useAccessibility } from '@/components/accessibility/AccessibilityProvider';
import { PerformanceMonitor } from '@/components/optimization/PerformanceMonitor';
import {
  TrophyIcon,
  PlusIcon,
  ChartBarIcon,
  UserIcon,
  BellIcon,
  CogIcon,
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  ArrowUpIcon,
  FlameIcon
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const { isDesktop, isMobile } = useBreakpoint();
  const { announceToScreenReader } = useAccessibility();

  const handleActionClick = (action: string) => {
    announceToScreenReader(`执行操作: ${action}`);
  };

  const breadcrumbItems = [
    { label: '首页', href: '/' },
    { label: '仪表板', current: true }
  ];

  const statsData = [
    {
      title: '总积分',
      value: '1,250',
      change: { value: '+180', type: 'increase' as const },
      icon: <TrophyIcon className="w-6 h-6" />
    },
    {
      title: '完成任务',
      value: '24',
      change: { value: '+6', type: 'increase' as const },
      icon: <CheckCircleIcon className="w-6 h-6" />
    },
    {
      title: '当前排名',
      value: '#2',
      change: { value: '↑1', type: 'increase' as const },
      icon: <StarIcon className="w-6 h-6" />
    },
    {
      title: '连续天数',
      value: '12',
      change: { value: '新记录!', type: 'increase' as const },
      icon: <FlameIcon className="w-6 h-6" />
    }
  ];

  const recentActivities = [
    {
      id: 1,
      title: '完成了"整理客厅"任务',
      time: '2小时前',
      reward: '+25 积分',
      status: 'completed',
      avatar: '/api/placeholder/32/32'
    },
    {
      id: 2,
      title: '认领了"洗碗"任务',
      time: '5小时前',
      reward: '进行中',
      status: 'in-progress',
      avatar: '/api/placeholder/32/32'
    },
    {
      id: 3,
      title: '获得"连续完成者"成就',
      time: '昨天',
      reward: '🏆',
      status: 'achievement',
      avatar: '/api/placeholder/32/32'
    },
    {
      id: 4,
      title: '参与了"家庭清洁日"活动',
      time: '2天前',
      reward: '+50 积分',
      status: 'completed',
      avatar: '/api/placeholder/32/32'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Performance Monitor */}
      <PerformanceMonitor enableDevMode={process.env.NODE_ENV === 'development'} />

      {/* Breadcrumb Navigation */}
      <ScrollAnimation animation="slide-down" delay={0}>
        <AccessibleBreadcrumb items={breadcrumbItems} />
      </ScrollAnimation>

      {/* Header Section */}
      <ScrollAnimation animation="fade-in" delay={100}>
        <Card className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <ResponsiveText
                as="h1"
                size={{ xs: '2xl', md: '3xl', lg: '4xl' }}
                weight={{ xs: 'bold', lg: 'extrabold' }}
                className="text-white mb-2"
              >
                <TypingAnimation
                  text="欢迎回到 KD之家"
                  speed={100}
                  cursor={false}
                />
              </ResponsiveText>
              <ResponsiveText
                size={{ xs: 'base', md: 'lg' }}
                className="text-glass-muted"
              >
                全面优化的现代化家务积分管理系统 ✨
              </ResponsiveText>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle
                variant={isMobile ? 'icon' : 'dropdown'}
                showLabel={!isMobile}
                size="md"
              />
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowAccessibility(true)}
                aria-label="无障碍设置"
              >
                <CogIcon className="w-5 h-5" />
                {!isMobile && <span className="ml-2">无障碍</span>}
              </Button>
            </div>
          </div>
        </Card>
      </ScrollAnimation>

      {/* Stats Cards */}
      <ScrollAnimation animation="slide-up" delay={200}>
        <ResponsiveGrid
          cols={{ xs: 1, sm: 2, lg: 4 }}
          gap={{ xs: 4, md: 6 }}
        >
          {statsData.map((stat, index) => (
            <HoverAnimation key={index} effect="lift" intensity="subtle">
              <StatsCard
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
              />
            </HoverAnimation>
          ))}
        </ResponsiveGrid>
      </ScrollAnimation>

      {/* Quick Actions */}
      <ScrollAnimation animation="slide-up" delay={300}>
        <Card className="p-8">
          <ResponsiveText
            as="h2"
            size={{ xs: 'xl', md: '2xl' }}
            weight={{ xs: 'bold', md: 'bold' }}
            className="text-white mb-6"
          >
            快速操作
          </ResponsiveText>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <HoverAnimation effect="scale">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  setShowModal(true);
                  handleActionClick('创建新任务');
                }}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                创建新任务
              </Button>
            </HoverAnimation>
            <HoverAnimation effect="scale">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => handleActionClick('查看排行榜')}
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                查看排行榜
              </Button>
            </HoverAnimation>
            <HoverAnimation effect="scale">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => handleActionClick('个人资料')}
              >
                <UserIcon className="w-4 h-4 mr-2" />
                个人资料
              </Button>
            </HoverAnimation>
            <HoverAnimation effect="scale">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => handleActionClick('通知中心')}
              >
                <BellIcon className="w-4 h-4 mr-2" />
                <Badge count={3}>通知中心</Badge>
              </Button>
            </HoverAnimation>
          </div>
        </Card>
      </ScrollAnimation>

      {/* Recent Activities */}
      <ScrollAnimation animation="slide-up" delay={400}>
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <ResponsiveText
              as="h2"
              size={{ xs: 'xl', md: '2xl' }}
              weight={{ xs: 'bold', md: 'bold' }}
              className="text-white"
            >
              最近活动
            </ResponsiveText>
            <Button variant="ghost" size="sm">
              查看全部
            </Button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <ScrollAnimation
                key={activity.id}
                animation="slide-right"
                delay={500 + index * 100}
              >
                <HoverAnimation effect="lift" intensity="subtle">
                  <div className="flex items-center p-4 bg-white/5 rounded-lg transition-all duration-300">
                    <Avatar
                      src={activity.avatar}
                      alt="用户头像"
                      name={activity.title}
                      size="md"
                      className="mr-4"
                    />

                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.title}</p>
                      <div className="flex items-center mt-1">
                        <ClockIcon className="w-3 h-3 text-glass-muted mr-1" />
                        <p className="text-glass-muted text-sm">{activity.time}</p>
                      </div>
                    </div>

                    <div className="ml-4">
                      {activity.status === 'completed' && (
                        <Badge variant="success">{activity.reward}</Badge>
                      )}
                      {activity.status === 'in-progress' && (
                        <Badge variant="warning">{activity.reward}</Badge>
                      )}
                      {activity.status === 'achievement' && (
                        <span className="text-2xl">{activity.reward}</span>
                      )}
                    </div>
                  </div>
                </HoverAnimation>
              </ScrollAnimation>
            ))}
          </div>
        </Card>
      </ScrollAnimation>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<PlusIcon className="w-6 h-6" />}
        onClick={() => setShowModal(true)}
        label="创建新任务"
        position="bottom-right"
      />

      {/* Modal Demo */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="创建新任务"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="任务名称"
            placeholder="请输入任务名称"
            required
          />
          <Input
            label="任务描述"
            placeholder="详细描述任务内容"
          />
          <Input
            label="积分奖励"
            type="number"
            placeholder="25"
            min="1"
            max="100"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={() => setShowModal(false)}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowModal(false);
              announceToScreenReader('任务创建成功');
            }}
          >
            创建任务
          </Button>
        </div>
      </Modal>

      {/* Accessibility Panel */}
      <AccessibilityPanel
        isOpen={showAccessibility}
        onClose={() => setShowAccessibility(false)}
      />
    </div>
  );
};

export default Dashboard;
