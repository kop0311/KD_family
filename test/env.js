// 测试环境变量配置
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // 使用不同的端口避免冲突
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3307';
process.env.DB_USER = 'kdfamily_user';
process.env.DB_PASSWORD = 'kdfamily_pass';
process.env.DB_NAME = 'kdfamily';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
process.env.JWT_EXPIRES_IN = '7d';
process.env.DOMAIN = 'localhost';
process.env.MAX_FILE_SIZE = '5242880';

console.log('🌍 Test environment variables loaded');