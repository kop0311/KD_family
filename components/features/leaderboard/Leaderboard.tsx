import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Button } from '@/components/ui/Button';
import { pointsAPI } from '@/services/api';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';

interface LeaderboardUser {
  id: number;
  username: string;
  fullName?: string;
  avatar?: string;
  totalPoints: number;
  level: number;
  completedTasks: number;
  rank: number;
}

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

const RankBadge: React.FC<RankBadgeProps> = ({ rank, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg'
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
    case 1:
      return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900';
    case 2:
      return 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900';
    case 3:
      return 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100';
    default:
      return 'bg-white/20 text-white';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
    case 1:
      return <Crown className="w-4 h-4" />;
    case 2:
      return <Medal className="w-4 h-4" />;
    case 3:
      return <Award className="w-4 h-4" />;
    default:
      return rank;
    }
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${getRankStyle(rank)}`}>
      {rank <= 3 ? getRankIcon(rank) : rank}
    </div>
  );
};

interface LeaderboardCardProps {
  user: LeaderboardUser;
  isCurrentUser?: boolean;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ user, isCurrentUser }) => {
  return (
    <GlassContainer
      className={`p-4 transition-all duration-300 hover:bg-white/15 ${
        isCurrentUser ? 'ring-2 ring-blue-400/50' : ''
      }`}
    >
      <div className="flex items-center space-x-4">
        <RankBadge rank={user.rank} size="lg" />

        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user.username[0]?.toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">
              {user.fullName || user.username}
            </h3>
            {isCurrentUser && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                我
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span>等级 {user.level}</span>
            <span>{user.completedTasks} 个任务</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">{user.totalPoints}</div>
          <div className="text-white/70 text-sm">积分</div>
        </div>
      </div>
    </GlassContainer>
  );
};

const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, icon, color = 'text-blue-400' }) => {
  return (
    <GlassContainer className="p-6 text-center">
      <div className={`${color} mb-3 flex justify-center`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-white/70 text-sm">{title}</div>
    </GlassContainer>
  );
};

export const Leaderboard: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [currentUserId] = useState(1); // 这里应该从认证上下文获取

  // 获取排行榜数据
  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => pointsAPI.getLeaderboard(period)
  });

  // 获取统计数据
  const { data: stats } = useQuery({
    queryKey: ['leaderboardStats'],
    queryFn: () => pointsAPI.getLeaderboard('all') // 获取总体统计
  });

  const periodOptions = [
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'all', label: '总榜' }
  ];

  const rankings = leaderboardData?.rankings || [];
  const topThree = rankings.slice(0, 3);
  const others = rankings.slice(3);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <GlassContainer className="p-8 text-center">
          <Trophy className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">加载失败</h2>
          <p className="text-white/70">无法加载排行榜数据，请刷新页面重试</p>
        </GlassContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            家庭排行榜
          </h1>
          <p className="text-white/70">查看家庭成员的积分排名和成就</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="活跃成员"
            value={stats?.activeUsers || 0}
            icon={<Users className="w-6 h-6" />}
            color="text-blue-400"
          />
          <StatsCard
            title="本月任务"
            value={stats?.monthlyTasks || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            color="text-green-400"
          />
          <StatsCard
            title="总积分"
            value={stats?.totalPoints || 0}
            icon={<Star className="w-6 h-6" />}
            color="text-yellow-400"
          />
        </div>

        {/* 时间段选择 */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white/10 backdrop-blur-md rounded-lg p-1">
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                variant={period === option.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(option.value as 'week' | 'month' | 'all')}
                className="mx-1"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <GlassContainer key={i} className="p-4">
                <div className="animate-pulse flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3"></div>
                  </div>
                  <div className="w-16 h-8 bg-white/20 rounded"></div>
                </div>
              </GlassContainer>
            ))}
          </div>
        ) : rankings.length > 0 ? (
          <div className="space-y-6">
            {/* 前三名特殊展示 */}
            {topThree.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 text-center">🏆 冠军榜</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topThree.map((user) => (
                    <GlassContainer key={user.id} className="p-6 text-center">
                      <RankBadge rank={user.rank} size="lg" />
                      <div className="mt-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            user.username[0]?.toUpperCase()
                          )}
                        </div>
                        <h3 className="font-semibold text-white mb-1">
                          {user.fullName || user.username}
                        </h3>
                        <div className="text-2xl font-bold text-yellow-400 mb-1">
                          {user.totalPoints}
                        </div>
                        <div className="text-white/70 text-sm">积分</div>
                      </div>
                    </GlassContainer>
                  ))}
                </div>
              </div>
            )}

            {/* 其他排名 */}
            {others.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">📊 完整排名</h2>
                <div className="space-y-3">
                  {others.map((user) => (
                    <LeaderboardCard
                      key={user.id}
                      user={user}
                      isCurrentUser={user.id === currentUserId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <GlassContainer className="p-8 text-center">
            <Trophy className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <h2 className="text-white text-xl font-semibold mb-2">暂无排名数据</h2>
            <p className="text-white/70">完成任务获得积分后就会出现在排行榜上</p>
          </GlassContainer>
        )}

        {/* 排名说明 */}
        <GlassContainer className="p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            排名规则
          </h3>
          <div className="text-white/80 text-sm space-y-2">
            <p>• <strong>本周</strong>：显示本周内获得的积分排名</p>
            <p>• <strong>本月</strong>：显示本月内获得的积分排名</p>
            <p>• <strong>总榜</strong>：显示历史累计积分排名</p>
            <p>• 积分相同时，按完成任务数量排序</p>
            <p>• 排行榜每小时更新一次</p>
          </div>
        </GlassContainer>
      </div>
    </div>
  );
};

export default Leaderboard;
