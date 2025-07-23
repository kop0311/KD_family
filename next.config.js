const { NextFederationPlugin } = require('@module-federation/nextjs-mf');
const moduleFederationConfig = require('./module-federation.config');

// Set required environment variable for Module Federation
process.env.NEXT_PRIVATE_LOCAL_WEBPACK = 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration (stable in Next.js 15)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Server external packages
  serverExternalPackages: ['mysql2', 'bcryptjs'],

  // Enable experimental features for Next.js 15
  experimental: {
    // Enable Module Federation for micro-frontend architecture
    esmExternals: true,
  },

  // TypeScript configuration
  typescript: {
    // Type checking is handled by separate script
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // ESLint is handled by separate script
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'utils'],
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack configuration with Module Federation
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add Module Federation plugin (temporarily disabled for compatibility)
    // config.plugins.push(
    //   new NextFederationPlugin(moduleFederationConfig)
    // );

    // Add support for importing SVG as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }

    return config;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Redirects and rewrites
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      // API routes are handled by Vercel serverless functions
      // No rewrites needed for Vercel deployment
    ];
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Output configuration - use default for Vercel
  // output: 'standalone', // Commented out for Vercel deployment
  
  // Compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Generate build ID
  generateBuildId: async () => {
    return `kd-family-${Date.now()}`;
  },

  // Bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
};

module.exports = nextConfig;
