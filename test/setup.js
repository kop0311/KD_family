// Jest测试环境设置文件
const mysql = require('mysql2/promise');

// 设置测试数据库连接
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3307';
process.env.DB_USER = process.env.DB_USER || 'kdfamily_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'kdfamily_pass';
process.env.DB_NAME = process.env.DB_NAME || 'kdfamily';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 全局测试超时时间
jest.setTimeout(30000);

// 全局的beforeAll和afterAll钩子
beforeAll(async () => {
  console.log('🚀 Starting test suite...');
  
  // 初始化数据库连接池
  const { initDatabase } = require('../config/database');
  
  try {
    await initDatabase();
    console.log('✅ Database connection pool initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database connection pool:', error);
    throw error;
  }
  
  // 等待数据库连接就绪
  let connection;
  let retries = 5;
  
  while (retries > 0) {
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
      });
      
      await connection.ping();
      console.log('✅ Database connection verified');
      await connection.end();
      break;
    } catch (error) {
      retries--;
      console.log(`⚠️  Database connection failed, retrying... (${retries} attempts left)`);
      
      if (retries === 0) {
        console.error('❌ Failed to connect to database after multiple attempts');
        throw error;
      }
      
      // 等待2秒后重试
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
});

afterAll(async () => {
  console.log('🏁 Test suite completed');
  
  // 关闭数据库连接池
  try {
    const { getPool } = require('../config/database');
    const pool = getPool();
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.log('⚠️  Database pool was not initialized or already closed');
  }
});

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 测试工具函数
global.testUtils = {
  // 生成随机字符串
  randomString: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // 等待指定时间
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 生成测试用户数据
  generateUserData: (role = 'member') => {
    const username = `test_${global.testUtils.randomString(6)}`;
    return {
      username,
      password: 'password123',
      email: `${username}@test.com`,
      fullName: `Test User ${username}`,
      role
    };
  },
  
  // 生成测试任务数据
  generateTaskData: (assignedTo = null) => {
    const title = `Test Task ${global.testUtils.randomString(4)}`;
    return {
      title,
      description: `Description for ${title}`,
      taskType: ['PM', 'FTL', 'PA', 'UBI'][Math.floor(Math.random() * 4)],
      points: Math.floor(Math.random() * 50) + 1,
      ...(assignedTo && { assignedTo })
    };
  }
};

console.log('🔧 Test setup completed');