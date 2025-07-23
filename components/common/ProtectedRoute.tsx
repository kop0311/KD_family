import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'advisor' | 'parent' | 'member';
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-8 text-center glass-container">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-glass">验证身份中...</p>
          </div>
        </div>
      )
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    router.push('/login');
    return null;
  }

  // Check role-based access if required
  if (requiredRole && user.role !== requiredRole) {
    // Check role hierarchy: advisor > parent > member
    const roleHierarchy = {
      advisor: 3,
      parent: 2,
      member: 1
    };

    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="p-8 text-center max-w-md glass-container">
            <h2 className="text-xl font-bold text-white mb-4">访问受限</h2>
            <p className="text-glass-muted mb-4">
              您没有权限访问此页面。需要 {requiredRole} 角色权限。
            </p>
            <button
              onClick={() => router.back()}
              className="glass-button-primary"
            >
              返回上一页
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
