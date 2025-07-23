'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { HMRTest } from '@/components/dev/HMRTest';

export function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎回来，{user?.name || '用户'}！
          </h1>
          <p className="text-gray-600">
            这是您的家务积分仪表板
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              总积分
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {user?.points || 0}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              本周任务
            </h3>
            <p className="text-3xl font-bold text-green-600">
              5
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              排名
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              #1
            </p>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            最近活动
          </h2>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <p className="text-gray-600">
              暂无最近活动
            </p>
          </div>
        </div>

        {/* Development HMR Test (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              开发工具
            </h2>
            <HMRTest />
          </div>
        )}
      </div>
    </div>
  );
}
