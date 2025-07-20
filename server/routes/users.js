const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Joi = require('joi');
const axios = require('axios');
const { getDatabase } = require('../database/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Use disk storage instead of memory storage for direct file saving
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    cb(null, `avatar_${req.user.id}_${uniqueSuffix}${path.extname(file.originalname)}`);
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

const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  currentPassword: Joi.string().min(6),
  newPassword: Joi.string().min(6)
});

router.get('/profile', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const users = await db.query(
      'SELECT id, username, email, full_name, role, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalPoints = await db.query(
      'SELECT COALESCE(SUM(points_change), 0) as total FROM points_history WHERE user_id = ?',
      [req.user.id]
    );

    const completedTasks = await db.query(
      'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = "approved"',
      [req.user.id]
    );

    res.json({
      user: {
        ...users[0],
        totalPoints: totalPoints[0].total,
        completedTasks: completedTasks[0].count
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/profile/:userId', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { userId } = req.params;

    // Users can only access their own profile unless they're admin
    if (req.user.id !== parseInt(userId) && req.user.role !== 'advisor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await db.query(
      'SELECT id, username, email, full_name, role, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalPoints = await db.query(
      'SELECT COALESCE(SUM(points_change), 0) as total FROM points_history WHERE user_id = ?',
      [userId]
    );

    const completedTasks = await db.query(
      'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = "approved"',
      [userId]
    );

    res.json({
      user: {
        ...users[0],
        totalPoints: totalPoints[0].total,
        completedTasks: completedTasks[0].count
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile/:userId', authenticateToken, async(req, res, next) => {
  try {
    const { userId } = req.params;

    // Users can only update their own profile unless they're admin
    if (req.user.id !== parseInt(userId) && req.user.role !== 'advisor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { fullName, email, currentPassword, newPassword } = value;
    const updates = {};

    if (fullName) updates.full_name = fullName;
    if (email) updates.email = email;

    if (newPassword && currentPassword) {
      const users = await db.db.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const saltRounds = 12;
      updates.password_hash = await bcrypt.hash(newPassword, saltRounds);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), userId];

    await db.db.query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { fullName, email, currentPassword, newPassword } = value;
    const updates = {};

    if (fullName) updates.full_name = fullName;
    if (email) updates.email = email;

    if (newPassword && currentPassword) {
      const users = await db.db.query(
        'SELECT password_hash FROM users WHERE id = ?',
        [req.user.id]
      );

      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      const saltRounds = 12;
      updates.password_hash = await bcrypt.hash(newPassword, saltRounds);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), req.user.id];

    await db.db.query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DiceBear API routes for avatar generation
router.get('/avatar/random', authenticateToken, async(req, res, next) => {
  try {
    const styles = ['avataaars', 'big-smile', 'bottts', 'fun-emoji', 'icons', 'identicon', 'initials', 'lorelei', 'micah', 'miniavs', 'open-peeps', 'personas', 'pixel-art', 'shapes', 'thumbs'];

    const avatars = styles.map(style => {
      const seed = Math.random().toString(36).substring(2, 15);
      return {
        style,
        url: `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`,
        seed
      };
    });

    res.json({ avatars });
  } catch (error) {
    next(error);
  }
});

router.get('/avatar/generate', authenticateToken, async(req, res, next) => {
  try {
    const { seed, style = 'avataaars' } = req.query;

    if (!seed) {
      return res.status(400).json({ error: 'Seed parameter is required' });
    }

    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

    res.json({ avatarUrl, seed, style });
  } catch (error) {
    next(error);
  }
});

router.get('/multiavatar/:seed', async(req, res, next) => {
  try {
    const { seed } = req.params;
    const multiavatarUrl = `https://api.multiavatar.com/${seed}.svg`;

    const response = await axios.get(multiavatarUrl, { responseType: 'arraybuffer' });

    res.set('Content-Type', 'image/svg+xml');
    res.send(response.data);
  } catch (error) {
    logger.error('Error fetching multiavatar:', error.message);
    if (error.response) {
      logger.error('Multiavatar API response error:', error.response.status, error.response.data.toString());
    }
    next(error);
  }
});

router.post('/avatar', authenticateToken, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async(req, res, next) => {
  try {
    const db = await getDatabase();
    if (req.file) {
      // File is already saved by multer disk storage
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      await db.run(
        'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [avatarUrl, req.user.id]
      );

      return res.json({
        message: 'Avatar updated successfully',
        avatarUrl
      });
    } else if (req.body.avatarUrl) {
      const avatarUrl = req.body.avatarUrl;

      // Simple URL validation
      try {
        new URL(avatarUrl);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      await db.run(
        'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [avatarUrl, req.user.id]
      );

      return res.json({
        message: 'Avatar updated successfully',
        avatarUrl
      });
    } else {
      return res.status(400).json({ error: 'No image file or avatar URL provided' });
    }
  } catch (error) {
    next(error);
  }
});

// Route for getting user list (non-admin users can see basic info)
router.get('/', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { role } = req.query;
    let whereClause = '';
    let params = [];

    if (role) {
      whereClause = 'WHERE u.role = ?';
      params = [role];
    }

    const users = await db.query(`
      SELECT
        u.id, u.username, u.email, u.full_name, u.role, u.avatar_url, u.created_at,
        COALESCE(SUM(ph.points_change), 0) as total_points,
        COUNT(DISTINCT t.id) as completed_tasks
      FROM users u
      LEFT JOIN points_history ph ON u.id = ph.user_id
      LEFT JOIN tasks t ON u.id = t.assigned_to AND t.status = 'approved'
      ${whereClause}
      GROUP BY u.id
      ORDER BY total_points DESC
    `, params);

    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/all', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const users = await db.query(`
      SELECT
        u.id, u.username, u.email, u.full_name, u.role, u.avatar_url, u.created_at,
        COALESCE(SUM(ph.points_change), 0) as total_points,
        COUNT(DISTINCT t.id) as completed_tasks
      FROM users u
      LEFT JOIN points_history ph ON u.id = ph.user_id
      LEFT JOIN tasks t ON u.id = t.assigned_to AND t.status = 'approved'
      GROUP BY u.id
      ORDER BY total_points DESC
    `);

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.put('/:userId/role', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { userId } = req.params;
    const { role } = req.body;

    if (!['advisor', 'parent', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await db.db.query(
      'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [role, userId]
    );

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
