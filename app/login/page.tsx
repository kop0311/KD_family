import { AuthForm } from '@/components/features/auth/AuthForm';

export const metadata = {
  title: '登录 - KD之家',
  description: '登录到KD之家家务积分系统'
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎回到 KD之家
          </h1>
          <p className="text-gray-600">
            登录您的账户以管理家务积分
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
