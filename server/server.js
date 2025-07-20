const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./utils/logger');
const { validateEnvironment, getEnvSummary } = require('./utils/envValidator');
require('dotenv').config();

// Validate environment variables on startup
if (!validateEnvironment()) {
  process.exit(1);
}

logger.info('Environment configuration:', getEnvSummary());

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const pointsRoutes = require('./routes/points');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const { getDatabase } = require('./database/connection');
const { startCronJobs } = require('./services/cronJobs');
const errorHandler = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/sanitizer');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      imgSrc: ['\'self\'', 'data:', 'https:', 'https://api.dicebear.com'],
      connectSrc: ['\'self\'', 'https://api.dicebear.com'],
      fontSrc: ['\'self\'', 'https:', 'data:', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\'']
    }
  }
}));
app.use(limiter);
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [`https://${process.env.DOMAIN}`, `http://${process.env.DOMAIN}`]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply input sanitization to all routes
app.use(sanitizeInput());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const achievementsDir = path.join(uploadsDir, 'achievements');

[uploadsDir, avatarsDir, achievementsDir].forEach(dir => {
  if (!require('fs').existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }
});

// 提供静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/roles', require('./routes/roles'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/custom-task-types', require('./routes/custom-task-types'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 页面路由配置
// 默认首页 - 使用 index-modern.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index-modern.html'));
});

// 管理后台入口
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-enhanced.html'));
});

// 管理后台预览页面
app.get('/admin-preview', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-preview.html'));
});

// 备选页面路由
app.get('/classic', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/modern-v2', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index-modern-v2.html'));
});

app.get('/admin-classic', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-dashboard.html'));
});

app.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'welcome.html'));
});

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index-modern.html'));
  });
}

app.use(errorHandler);

async function startServer() {
  try {
    await getDatabase();
    logger.info('Database connection established');
    startCronJobs();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
