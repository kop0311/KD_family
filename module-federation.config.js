const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

const moduleFederationConfig = {
  name: 'kd_family_host',
  filename: 'static/chunks/remoteEntry.js',
  
  // Expose components for other micro-frontends to consume
  exposes: {
    './Dashboard': './components/features/dashboard/DashboardContent',
    './Tasks': './components/features/tasks/TasksContent',
    './Leaderboard': './components/features/leaderboard/LeaderboardContent',
    './Profile': './components/features/profile/ProfileContent',
    './Admin': './components/features/admin/AdminContent',
    './Auth': './components/features/auth/LoginForm',
    './Layout': './components/layout/Layout',
    './GlassContainer': './components/ui/GlassContainer',
    './Button': './components/ui/Button',
    './AuthProvider': './components/providers/AuthProvider',
    './NotificationProvider': './components/providers/NotificationProvider',
  },

  // Remote micro-frontends to consume (can be added later)
  remotes: {
    // Example: 'analytics': 'analytics@http://localhost:3002/_next/static/chunks/remoteEntry.js',
    // Example: 'reporting': 'reporting@http://localhost:3003/_next/static/chunks/remoteEntry.js',
  },

  // Shared dependencies to avoid duplication
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^18.3.1',
      eager: true,
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^18.3.1',
      eager: true,
    },
    'next/router': {
      singleton: true,
      eager: true,
    },
    'next/navigation': {
      singleton: true,
      eager: true,
    },
    '@/types/user': {
      singleton: true,
      eager: true,
    },
    '@/services/auth': {
      singleton: true,
      eager: true,
    },
    '@/services/api': {
      singleton: true,
      eager: true,
    },
    'tailwindcss': {
      singleton: true,
      eager: true,
    },
    'clsx': {
      singleton: true,
      eager: true,
    },
    'zustand': {
      singleton: true,
      eager: true,
    },
  },

  // Additional options
  extraOptions: {
    exposePages: true,
    enableImageLoaderFix: true,
    enableUrlLoaderFix: true,
  },
};

module.exports = moduleFederationConfig;
