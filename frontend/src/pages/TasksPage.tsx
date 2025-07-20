import { motion } from 'framer-motion'

export function TasksPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8"
    >
      <h1 className="text-3xl font-bold text-white mb-4">任务管理</h1>
      <p className="text-white/80 text-lg">
        任务管理功能正在开发中...
      </p>
    </motion.div>
  )
}
