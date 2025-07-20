import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { LoginCredentials } from '@/types'

const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
      navigate(from, { replace: true })
    } catch (error) {
      // Error is handled by the store and toast
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">欢迎回来</h2>
        <p className="text-white/80">登录您的账户继续使用</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          {...register('username')}
          label="用户名"
          placeholder="请输入用户名"
          error={errors.username?.message}
          leftIcon={<UserIcon className="h-4 w-4" />}
          className="bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white focus:ring-white"
        />

        <div className="relative">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            label="密码"
            placeholder="请输入密码"
            error={errors.password?.message}
            leftIcon={<LockIcon className="h-4 w-4" />}
            className="bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white focus:ring-white pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-white/60 hover:text-white"
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        <Button
          type="submit"
          loading={isLoading}
          className="w-full bg-white text-primary-600 hover:bg-white/90 focus:ring-white"
          size="lg"
        >
          登录
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-white/80">
          还没有账户？{' '}
          <Link
            to="/auth/register"
            className="font-medium text-white hover:text-white/80 underline"
          >
            立即注册
          </Link>
        </p>
      </div>

      {/* Demo accounts info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10"
      >
        <h3 className="text-sm font-medium text-white mb-2">演示账户</h3>
        <div className="text-xs text-white/70 space-y-1">
          <p>管理员: admin / admin123</p>
          <p>家长: parent / parent123</p>
          <p>成员: member / member123</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
