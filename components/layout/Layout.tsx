'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNotification } from '@/components/providers/NotificationProvider';
import { ROLE_PERMISSIONS } from '@/types/user';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { addNotification } = useNotification();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      addNotification({
        type: 'success',
        message: '已成功退出登录'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: '退出登录失败'
      });
    }
  };

  const isActivePath = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const canAccessAdmin = user && ROLE_PERMISSIONS[user.role]?.canManageUsers;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <GlassContainer className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src="/assets/logo.svg"
                  alt="KD之家"
                  className="w-10 h-10"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white">KD之家</h1>
                  <p className="text-glass-muted">现代化家务积分管理系统</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                {/* Navigation */}
                <nav className="hidden md:flex space-x-4">
                  <Link
                    href="/dashboard"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActivePath('/dashboard')
                        ? 'bg-white/20 text-white'
                        : 'text-glass hover:text-white hover:bg-white/10'
                    }`}
                  >
                    仪表板
                  </Link>
                  <Link
                    href="/tasks"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActivePath('/tasks')
                        ? 'bg-white/20 text-white'
                        : 'text-glass hover:text-white hover:bg-white/10'
                    }`}
                  >
                    任务
                  </Link>
                  <Link
                    href="/leaderboard"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActivePath('/leaderboard')
                        ? 'bg-white/20 text-white'
                        : 'text-glass hover:text-white hover:bg-white/10'
                    }`}
                  >
                    排行榜
                  </Link>
                  <Link
                    href="/profile"
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      isActivePath('/profile')
                        ? 'bg-white/20 text-white'
                        : 'text-glass hover:text-white hover:bg-white/10'
                    }`}
                  >
                    个人资料
                  </Link>
                  {canAccessAdmin && (
                    <Link
                      href="/admin"
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        isActivePath('/admin')
                          ? 'bg-white/20 text-white'
                          : 'text-glass hover:text-white hover:bg-white/10'
                      }`}
                    >
                      管理
                    </Link>
                  )}
                </nav>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-white text-sm font-medium">{user?.username}</p>
                      <p className="text-glass-muted text-xs">{user?.role}</p>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 glass-container p-2 z-50">
                      <Link
                        href="/profile"
                        className="block px-3 py-2 text-glass hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        个人资料
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-glass hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassContainer>
        </header>

        {/* Main Content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};
