const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'analytics',
        filename: 'static/chunks/remoteEntry.js',
        
        exposes: {
          './AnalyticsDashboard': './components/AnalyticsDashboard',
          './ReportsView': './components/ReportsView',
        },

        remotes: {
          host: 'kd_family_host@http://localhost:3001/_next/static/chunks/remoteEntry.js',
        },

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
        },
      })
    );

    return config;
  },
};

module.exports = nextConfig;
