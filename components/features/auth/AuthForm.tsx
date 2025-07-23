'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ButtonShadcn as Button } from '@/components/ui/button-shadcn';
import { InputShadcn as Input } from '@/components/ui/input-shadcn';
import { Label } from '@/components/ui/label';
import { CardShadcn as Card, CardContentShadcn as CardContent, CardDescription, CardHeaderShadcn as CardHeader, CardTitle } from '@/components/ui/card-shadcn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SelectShadcn as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-shadcn';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginFormData {
  username: string;
  password: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: 'advisor' | 'parent' | 'member';
}

export function AuthForm() {
  const { login, register, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    username: '',
    password: ''
  });

  // Registration form state
  const [registerForm, setRegisterForm] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'member'
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginForm.username || !loginForm.password) {
      setError('请填写用户名和密码');
      return;
    }

    try {
      await login(loginForm.username, loginForm.password);
    } catch (error: any) {
      setError(error.message || '登录失败，请检查用户名和密码');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.fullName) {
      setError('请填写所有必填字段');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('密码确认不匹配');
      return;
    }

    if (registerForm.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    try {
      await register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        fullName: registerForm.fullName,
        role: registerForm.role
      });
    } catch (error: any) {
      setError(error.message || '注册失败，请重试');
    }
  };

  const updateLoginForm = (field: keyof LoginFormData, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const updateRegisterForm = (field: keyof RegisterFormData, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          KD之家
        </CardTitle>
        <CardDescription>
          家务积分管理系统
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="login" className="space-y-4 mt-6">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">用户名或邮箱</Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="请输入用户名或邮箱"
                  value={loginForm.username}
                  onChange={(e) => updateLoginForm('username', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">密码</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={loginForm.password}
                    onChange={(e) => updateLoginForm('password', e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-6">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-fullname">姓名 *</Label>
                <Input
                  id="register-fullname"
                  type="text"
                  placeholder="请输入真实姓名"
                  value={registerForm.fullName}
                  onChange={(e) => updateRegisterForm('fullName', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-username">用户名 *</Label>
                <Input
                  id="register-username"
                  type="text"
                  placeholder="请输入用户名"
                  value={registerForm.username}
                  onChange={(e) => updateRegisterForm('username', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">邮箱 *</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  value={registerForm.email}
                  onChange={(e) => updateRegisterForm('email', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-role">角色</Label>
                <Select
                  value={registerForm.role}
                  onValueChange={(value) => updateRegisterForm('role', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">家庭成员</SelectItem>
                    <SelectItem value="parent">家长</SelectItem>
                    <SelectItem value="advisor">顾问</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">密码 *</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码（至少6位）"
                    value={registerForm.password}
                    onChange={(e) => updateRegisterForm('password', e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password">确认密码 *</Label>
                <div className="relative">
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    value={registerForm.confirmPassword}
                    onChange={(e) => updateRegisterForm('confirmPassword', e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    注册中...
                  </>
                ) : (
                  '注册账户'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
