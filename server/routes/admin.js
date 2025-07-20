const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../database/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'medals');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'medal-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const ubiTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000),
  points: Joi.number().integer().min(1).max(100).default(5),
  isActive: Joi.boolean().default(true)
});

const configSchema = Joi.object({
  key: Joi.string().required(),
  value: Joi.string().required(),
  description: Joi.string()
});

router.post('/users', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    // 手动处理email字段
    const { username, email, password, fullName, role } = req.body;

    // 基本验证
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Username, password, fullName, and role are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!['advisor', 'parent', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // 验证email格式（如果提供了的话）
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 如果邮箱为空，设置为null
    const emailValue = email && email.trim() !== '' ? email : null;

    const result = await db.db.query(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, emailValue, passwordHash, fullName, role]
    );

    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }
    next(error);
  }
});

router.delete('/users/:userId', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const userId = parseInt(req.params.userId);

    if (!userId || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // 检查用户是否存在
    const userExists = await db.db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (userExists.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 防止删除自己
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    // 删除用户相关数据（外键约束处理）
    await db.db.query('DELETE FROM points_history WHERE user_id = ?', [userId]);
    await db.db.query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?', [userId]);
    await db.db.query('UPDATE tasks SET created_by = NULL WHERE created_by = ?', [userId]);
    await db.db.query('UPDATE tasks SET approved_by = NULL WHERE approved_by = ?', [userId]);

    // 删除用户
    await db.db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/users', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const users = await db.db.query(`
            SELECT id, username, email, full_name, role, avatar_url, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const totalUsers = await db.db.query('SELECT COUNT(*) as count FROM users');
    const totalTasks = await db.db.query('SELECT COUNT(*) as count FROM tasks');
    const pendingApprovals = await db.db.query('SELECT COUNT(*) as count FROM tasks WHERE status = "completed"');
    const activeUsers = await db.db.query(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM points_history 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
    `);

    const recentActivity = await db.db.query(`
      SELECT 
        'task_created' as type, t.title as description, t.created_at as timestamp,
        u.full_name as user_name
      FROM tasks t
      JOIN users u ON t.created_by = u.id
      WHERE t.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
      
      UNION ALL
      
      SELECT 
        'task_completed' as type, 
        CONCAT('Completed: ', t.title) as description, 
        t.completed_at as timestamp,
        u.full_name as user_name
      FROM tasks t
      JOIN users u ON t.assigned_to = u.id
      WHERE t.completed_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
      
      ORDER BY timestamp DESC
      LIMIT 20
    `);

    res.json({
      stats: {
        totalUsers: totalUsers[0].count,
        totalTasks: totalTasks[0].count,
        pendingApprovals: pendingApprovals[0].count,
        activeUsers: activeUsers[0].count
      },
      recentActivity
    });
  } catch (error) {
    next(error);
  }
});

router.get('/ubi-templates', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const templates = await db.db.query(`
      SELECT ut.*, u.full_name as created_by_name
      FROM ubi_templates ut
      JOIN users u ON ut.created_by = u.id
      ORDER BY ut.is_active DESC, ut.created_at DESC
    `);

    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

router.post('/ubi-templates', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { error, value } = ubiTemplateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description, points, isActive } = value;

    const result = await db.db.query(`
      INSERT INTO ubi_templates (name, description, points, is_active, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [name, description, points, isActive, req.user.id]);

    res.status(201).json({
      message: 'UBI template created successfully',
      templateId: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

router.put('/ubi-templates/:templateId', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { templateId } = req.params;
    const { error, value } = ubiTemplateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description, points, isActive } = value;

    const result = await db.db.query(`
      UPDATE ubi_templates 
      SET name = ?, description = ?, points = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, points, isActive, templateId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'UBI template not found' });
    }

    res.json({ message: 'UBI template updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/generate-ubi-tasks', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { date, userIds } = req.body;

    if (!date || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'Date and user IDs are required' });
    }

    const activeTemplates = await db.db.query('SELECT * FROM ubi_templates WHERE is_active = TRUE');
    const ubiTaskType = await db.db.query('SELECT id FROM task_types WHERE code = "UBI"');

    if (ubiTaskType.length === 0) {
      return res.status(500).json({ error: 'UBI task type not found' });
    }

    let createdCount = 0;

    for (const template of activeTemplates) {
      for (const userId of userIds) {
        await db.db.query(`
          INSERT INTO tasks (title, description, task_type_id, assigned_to, created_by, points, due_date, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [
          template.name,
          template.description,
          ubiTaskType[0].id,
          userId,
          req.user.id,
          template.points,
          date
        ]);
        createdCount++;
      }
    }

    res.json({
      message: 'UBI tasks generated successfully',
      createdCount,
      templates: activeTemplates.length,
      users: userIds.length
    });
  } catch (error) {
    next(error);
  }
});

router.get('/config', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const config = await db.db.query('SELECT * FROM system_config ORDER BY config_key');
    res.json({ config });
  } catch (error) {
    next(error);
  }
});

router.put('/config/:key', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { key } = req.params;
    const { error, value } = configSchema.validate({ key, ...req.body });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { value: configValue, description } = value;

    const result = await db.db.query(`
      UPDATE system_config 
      SET config_value = ?, description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP
      WHERE config_key = ?
    `, [configValue, description, key]);

    if (result.affectedRows === 0) {
      await db.db.query(`
        INSERT INTO system_config (config_key, config_value, description)
        VALUES (?, ?, ?)
      `, [key, configValue, description]);
    }

    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/weekly-settlement/:settlementId/medal',
  authenticateToken,
  requireAdmin,
  upload.single('medal'),
  async(req, res, next) => {
    try {
    const db = await getDatabase();
      const { settlementId } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'Medal image is required' });
      }

      const medalUrl = `/uploads/medals/${req.file.filename}`;

      const result = await db.db.query(`
        UPDATE weekly_settlements 
        SET medal_image_url = ? 
        WHERE id = ?
      `, [medalUrl, settlementId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Weekly settlement not found' });
      }

      res.json({
        message: 'Medal uploaded successfully',
        medalUrl
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
