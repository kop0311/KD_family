// Test environment variables setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'kdfamily_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';

// Disable external API calls in tests
process.env.DISABLE_EXTERNAL_APIS = 'true';

// Set test-specific configurations
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests
process.env.UPLOAD_PATH = './test-uploads';
process.env.SESSION_SECRET = 'test-session-secret';

// Mock environment for consistent testing
process.env.TZ = 'UTC';
