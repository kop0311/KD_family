import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HomeIcon } from 'lucide-react'

import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-secondary-500 to-purple-600">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-9xl font-bold text-white/20 mb-4"
        >
          404
        </motion.div>
        
        <h1 className="text-4xl font-bold text-white mb-4">页面未找到</h1>
        <p className="text-white/80 text-lg mb-8 max-w-md">
          抱歉，您访问的页面不存在。可能是链接错误或页面已被移动。
        </p>
        
        <Button
          as={Link}
          to="/dashboard"
          leftIcon={<HomeIcon className="h-4 w-4" />}
          className="bg-white text-primary-600 hover:bg-white/90"
        >
          返回首页
        </Button>
      </motion.div>
    </div>
  )
}
