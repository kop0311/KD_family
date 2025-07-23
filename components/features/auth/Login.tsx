import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Button } from '@/components/ui/Button';
import { FormField, FormContainer, FormActions } from '@/components/ui/FormField';
import { useAuth } from './AuthProvider';
import { useNotification } from '@/components/common/NotificationProvider';
import { useForm } from '@/hooks/useForm';
import { validateUsername, validatePassword, validateEmail, validateFullName } from '@/utils/validation';

const Login: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);

  const { login, register, isLoading, error, clearError, isAuthenticated } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // 登录表单
  const loginForm = useForm({
    initialValues: {
      username: '',
      password: ''
    },
    validators: {
      username: validateUsername,
      password: validatePassword
    },
    onSubmit: async (values) => {
      try {
        await login(values);
        addNotification({
          type: 'success',
          message: '登录成功！'
        });
      } catch (error) {
        // Error is handled by AuthProvider
      }
    }
  });

  // 注册表单
  const registerForm = useForm({
    initialValues: {
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'member' as 'advisor' | 'parent' | 'member'
    },
    validators: {
      username: validateUsername,
      email: validateEmail,
      password: validatePassword,
      fullName: validateFullName
    },
    onSubmit: async (values) => {
      try {
        await register(values);
        addNotification({
          type: 'success',
          message: '注册成功！'
        });
      } catch (error) {
        // Error is handled by AuthProvider
      }
    }
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear error when switching between login/register
  useEffect(() => {
    clearError();
    loginForm.clearErrors();
    registerForm.clearErrors();
  }, [showRegister, clearError]);



  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlassContainer variant="modal" className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/assets/logo.svg"
            alt="KD之家"
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">
            {showRegister ? '加入 KD之家' : '欢迎回到 KD之家'}
          </h1>
          <p className="text-glass-muted">
            {showRegister ? '创建您的账户' : '请登录您的账户'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-300/30 rounded-lg">
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        {showRegister ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                用户名 *
              </label>
              <input
                type="text"
                name="username"
                value={registerData.username}
                onChange={handleInputChange}
                className="glass-input w-full"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                邮箱 *
              </label>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleInputChange}
                className="glass-input w-full"
                placeholder="请输入邮箱地址"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                姓名 *
              </label>
              <input
                type="text"
                name="fullName"
                value={registerData.fullName}
                onChange={handleInputChange}
                className="glass-input w-full"
                placeholder="请输入真实姓名"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                角色
              </label>
              <select
                name="role"
                value={registerData.role}
                onChange={handleInputChange}
                className="glass-input w-full"
              >
                <option value="member">家庭成员</option>
                <option value="parent">家长</option>
                <option value="advisor">管理员</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                密码 *
              </label>
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleInputChange}
                className="glass-input w-full"
                placeholder="请输入密码 (至少6位)"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              注册
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                用户名
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="glass-input w-full"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                密码
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="glass-input w-full"
                placeholder="请输入密码"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              登录
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-glass-muted text-sm">
            {showRegister ? '已有账户？' : '还没有账户？'}{' '}
            <button
              type="button"
              onClick={() => setShowRegister(!showRegister)}
              className="text-primary-300 hover:text-primary-200 underline"
            >
              {showRegister ? '立即登录' : '立即注册'}
            </button>
          </p>
        </div>
      </GlassContainer>
    </div>
  );
};

export default Login;
