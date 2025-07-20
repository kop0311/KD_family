module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // 测试覆盖率设置
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/node_modules/**',
    '!**/coverage/**',
    '!**/node_modules/**'
  ],
  
  // 测试超时时间（毫秒）
  testTimeout: 30000,
  
  // 测试前的设置
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // 环境变量
  setupFiles: ['<rootDir>/test/env.js'],
  
  // 忽略的路径
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  
  // 详细输出
  verbose: true,
  
  // 检测到打开的handles时退出
  forceExit: true,
  
  // 每次测试后清理模拟
  clearMocks: true,
  
  // 报告器
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'test-report.html',
      expand: true
    }]
  ]
};