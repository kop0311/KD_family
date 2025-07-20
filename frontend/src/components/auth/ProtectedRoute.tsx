import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'advisor' | 'parent' | 'member'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-secondary-500 to-purple-600">
        <LoadingSpinner size="lg" color="white" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = {
      advisor: 3,
      parent: 2,
      member: 1,
    }

    const userRoleLevel = roleHierarchy[user.role]
    const requiredRoleLevel = roleHierarchy[requiredRole]

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-secondary-500 to-purple-600">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">权限不足</h1>
            <p className="text-lg opacity-90">您没有访问此页面的权限</p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-6 py-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors"
            >
              返回上一页
            </button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
