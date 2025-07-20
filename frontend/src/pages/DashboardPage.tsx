import { motion } from 'framer-motion'
import { TrophyIcon, CheckSquareIcon, CalendarIcon, TrendingUpIcon } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'

const stats = [
  {
    name: '本周积分',
    value: '128',
    icon: TrophyIcon,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
  },
  {
    name: '完成任务',
    value: '12',
    icon: CheckSquareIcon,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  {
    name: '连续天数',
    value: '5',
    icon: CalendarIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    name: '排名',
    value: '#2',
    icon: TrendingUpIcon,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
]

const recentTasks = [
  { id: 1, title: '洗碗', points: 10, status: 'completed', time: '2小时前' },
  { id: 2, title: '整理房间', points: 15, status: 'completed', time: '4小时前' },
  { id: 3, title: '倒垃圾', points: 5, status: 'pending', time: '今天' },
  { id: 4, title: '洗衣服', points: 12, status: 'available', time: '明天' },
]

export function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          欢迎回来，{user?.full_name}！
        </h1>
        <p className="text-white/80 text-lg">
          今天是美好的一天，让我们一起完成家务任务吧！
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-white/80 text-sm">{stat.name}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8"
      >
        <h2 className="text-2xl font-bold text-white mb-6">最近任务</h2>
        <div className="space-y-4">
          {recentTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-4 ${
                  task.status === 'completed' ? 'bg-green-400' :
                  task.status === 'pending' ? 'bg-yellow-400' : 'bg-gray-400'
                }`} />
                <div>
                  <h3 className="text-white font-medium">{task.title}</h3>
                  <p className="text-white/60 text-sm">{task.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">+{task.points} 积分</p>
                <p className={`text-sm ${
                  task.status === 'completed' ? 'text-green-400' :
                  task.status === 'pending' ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {task.status === 'completed' ? '已完成' :
                   task.status === 'pending' ? '待审核' : '可认领'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4">快速操作</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-white">
              📋 查看可用任务
            </button>
            <button className="w-full text-left p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-white">
              🏆 查看排行榜
            </button>
            <button className="w-full text-left p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-white">
              🎯 查看成就
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4">本周目标</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-white mb-2">
                <span>完成任务</span>
                <span>12/15</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-green-400 h-2 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-white mb-2">
                <span>获得积分</span>
                <span>128/150</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
