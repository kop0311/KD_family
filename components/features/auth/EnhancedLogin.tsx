import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Button } from '@/components/ui/Button';
import { FormField, FormContainer, FormActions } from '@/components/ui/FormField';
import { useAuth } from './AuthProvider';
import { useNotification } from '@/components/common/NotificationProvider';
import { useForm } from '@/hooks/useForm';
import { validateUsername, validatePassword, validateEmail, validateFullName } from '@/utils/validation';

const EnhancedLogin: React.FC = () => {
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
          <FormContainer onSubmit={registerForm.handleSubmit}>
            <FormField
              label="用户名"
              name="username"
              type="text"
              value={registerForm.values.username}
              onChange={registerForm.handleChange('username')}
              onBlur={registerForm.handleBlur('username')}
              placeholder="请输入用户名"
              required
              error={registerForm.errors.username}
              validator={(value) => {
                const result = validateUsername(value);
                return result.isValid ? null : (result.message || '验证失败');
              }}
            />

            <FormField
              label="邮箱"
              name="email"
              type="email"
              value={registerForm.values.email}
              onChange={registerForm.handleChange('email')}
              onBlur={registerForm.handleBlur('email')}
              placeholder="请输入邮箱"
              required
              error={registerForm.errors.email}
              validator={(value) => {
                const result = validateEmail(value);
                return result.isValid ? null : (result.message || '验证失败');
              }}
            />

            <FormField
              label="姓名"
              name="fullName"
              type="text"
              value={registerForm.values.fullName}
              onChange={registerForm.handleChange('fullName')}
              onBlur={registerForm.handleBlur('fullName')}
              placeholder="请输入真实姓名"
              required
              error={registerForm.errors.fullName}
              validator={(value) => {
                const result = validateFullName(value);
                return result.isValid ? null : (result.message || '验证失败');
              }}
            />

            <FormField
              label="角色"
              name="role"
              type="select"
              value={registerForm.values.role}
              onChange={registerForm.handleChange('role')}
              onBlur={registerForm.handleBlur('role')}
              required
              options={[
                { value: 'member', label: '家庭成员' },
                { value: 'parent', label: '家长' },
                { value: 'advisor', label: '顾问' }
              ]}
            />

            <FormField
              label="密码"
              name="password"
              type="password"
              value={registerForm.values.password}
              onChange={registerForm.handleChange('password')}
              onBlur={registerForm.handleBlur('password')}
              placeholder="请输入密码 (至少6位)"
              required
              error={registerForm.errors.password}
              validator={(value) => {
                const result = validatePassword(value);
                return result.isValid ? null : (result.message || '验证失败');
              }}
            />

            <FormActions>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={registerForm.isSubmitting || isLoading}
                disabled={!registerForm.isValid}
              >
                注册
              </Button>
            </FormActions>
          </FormContainer>
        ) : (
          <FormContainer onSubmit={loginForm.handleSubmit}>
            <FormField
              label="用户名"
              name="username"
              type="text"
              value={loginForm.values.username}
              onChange={loginForm.handleChange('username')}
              onBlur={loginForm.handleBlur('username')}
              placeholder="请输入用户名"
              required
              error={loginForm.errors.username}
              validator={(value) => {
                const result = validateUsername(value);
                return result.isValid ? null : (result.message || '验证失败');
              }}
            />

            <FormField
              label="密码"
              name="password"
              type="password"
              value={loginForm.values.password}
              onChange={loginForm.handleChange('password')}
              onBlur={loginForm.handleBlur('password')}
              placeholder="请输入密码"
              required
              error={loginForm.errors.password}
              validator={(value) => {
                const result = validatePassword(value);
                return result.isValid ? null : (result.message || '验证失败');
              }}
            />

            <FormActions>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loginForm.isSubmitting || isLoading}
                disabled={!loginForm.isValid}
              >
                登录
              </Button>
            </FormActions>
          </FormContainer>
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

export default EnhancedLogin;
