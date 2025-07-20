import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, UserCheckIcon } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { RegisterData } from '@/types'

const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(30, '用户名最多30个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
  fullName: z.string().min(2, '姓名至少2个字符').max(100, '姓名最多100个字符'),
  role: z.enum(['advisor', 'parent', 'member']).default('member'),
})

type RegisterFormData = z.infer<typeof registerSchema>

const roleOptions = [
  { value: 'member', label: '家庭成员', description: '参与家务任务，获得积分奖励' },
  { value: 'parent', label: '家长', description: '管理家务任务，查看家庭统计' },
  { value: 'advisor', label: '管理员', description: '完全管理权限，系统配置' },
]

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'member',
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data)
      navigate('/dashboard', { replace: true })
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
        <h2 className="text-2xl font-bold text-white mb-2">加入KD之家</h2>
        <p className="text-white/80">创建您的账户开始使用</p>
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

        <Input
          {...register('email')}
          type="email"
          label="邮箱"
          placeholder="请输入邮箱地址"
          error={errors.email?.message}
          leftIcon={<MailIcon className="h-4 w-4" />}
          className="bg-white/10 border-white/20 text-white placeholder-white/60 focus:border-white focus:ring-white"
        />

        <Input
          {...register('fullName')}
          label="姓名"
          placeholder="请输入真实姓名"
          error={errors.fullName?.message}
          leftIcon={<UserCheckIcon className="h-4 w-4" />}
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

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">选择角色</label>
          <div className="space-y-3">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-start p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole === option.value
                    ? 'border-white bg-white/10'
                    : 'border-white/20 hover:border-white/40'
                }`}
              >
                <input
                  {...register('role')}
                  type="radio"
                  value={option.value}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="text-white font-medium">{option.label}</div>
                  <div className="text-white/70 text-sm">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.role && (
            <p className="mt-1 text-sm text-red-300">{errors.role.message}</p>
          )}
        </div>

        <Button
          type="submit"
          loading={isLoading}
          className="w-full bg-white text-primary-600 hover:bg-white/90 focus:ring-white"
          size="lg"
        >
          注册
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-white/80">
          已有账户？{' '}
          <Link
            to="/auth/login"
            className="font-medium text-white hover:text-white/80 underline"
          >
            立即登录
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
