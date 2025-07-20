const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// 尝试导入sharp，如果不可用则使用null
let sharp = null;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp不可用，图片处理功能将被禁用:', error.message);
}
const { getDatabase } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for achievement image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'achievements');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
    cb(null, `achievement_${req.user.id}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get user's achievements
router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const achievements = await db.query(`
      SELECT 
        a.id, a.title, a.description, a.image_url, a.points_earned, a.created_at,
        t.title as task_title, t.id as task_id
      FROM achievements a
      LEFT JOIN tasks t ON a.task_id = t.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), offset]);
    
    const totalCount = await db.query('SELECT COUNT(*) as count FROM achievements WHERE user_id = ?', [req.user.id]);
    
    res.json({
      achievements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all achievements (for achievement wall)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { page = 1, limit = 20, groupId } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    
    if (groupId) {
      whereClause = 'WHERE u.group_id = ?';
      params.push(groupId);
    }
    
    const achievements = await db.query(`
      SELECT 
        a.id, a.title, a.description, a.image_url, a.points_earned, a.created_at,
        u.username, u.full_name, u.avatar_url,
        t.title as task_title, t.id as task_id
      FROM achievements a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN tasks t ON a.task_id = t.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    const countQuery = groupId 
      ? 'SELECT COUNT(*) as count FROM achievements a JOIN users u ON a.user_id = u.id WHERE u.group_id = ?'
      : 'SELECT COUNT(*) as count FROM achievements';
    const countParams = groupId ? [groupId] : [];
    
    const totalCount = await db.query(countQuery, countParams);
    
    res.json({
      achievements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Upload achievement
router.post('/', authenticateToken, (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    try {
      const db = await getDatabase();
      const { title, description, taskId, pointsEarned } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      let imageUrl = null;
      
      if (req.file) {
        // Optimize image using Sharp
        const optimizedPath = req.file.path.replace(path.extname(req.file.path), '_optimized.jpg');
        
        await sharp(req.file.path)
          .resize(800, 600, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ 
            quality: 85,
            progressive: true 
          })
          .toFile(optimizedPath);
        
        // Remove original file
        fs.unlinkSync(req.file.path);
        
        imageUrl = `/uploads/achievements/${path.basename(optimizedPath)}`;
      }
      
      // Create achievement
      const result = await db.run(`
        INSERT INTO achievements (user_id, title, description, image_url, points_earned, task_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        req.user.id,
        title,
        description || null,
        imageUrl,
        parseInt(pointsEarned) || 0,
        taskId || null
      ]);
      
      logger.info(`Achievement created by user ${req.user.id}: ${title}`);
      res.json({
        message: 'Achievement uploaded successfully',
        achievementId: result.id,
        imageUrl
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  });
});

// Update achievement
router.put('/:achievementId', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { achievementId } = req.params;
    const { title, description, pointsEarned } = req.body;
    
    // Check if achievement exists and belongs to user
    const achievement = await db.query('SELECT user_id FROM achievements WHERE id = ?', [achievementId]);
    if (achievement.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    // Users can only edit their own achievements, unless they have manage permissions
    const { hasPermission } = require('../middleware/permissions');
    const canManage = await hasPermission(req.user.id, 'manage_users');
    if (achievement[0].user_id !== req.user.id && !canManage) {
      return res.status(403).json({ error: 'Can only edit your own achievements' });
    }
    
    // Update achievement
    await db.run(`
      UPDATE achievements 
      SET title = ?, description = ?, points_earned = ?
      WHERE id = ?
    `, [title, description || null, parseInt(pointsEarned) || 0, achievementId]);
    
    res.json({ message: 'Achievement updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete achievement
router.delete('/:achievementId', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { achievementId } = req.params;
    
    // Get achievement details
    const achievement = await db.query('SELECT user_id, image_url FROM achievements WHERE id = ?', [achievementId]);
    if (achievement.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }
    
    // Users can only delete their own achievements, unless they have manage permissions
    const { hasPermission } = require('../middleware/permissions');
    const canManage = await hasPermission(req.user.id, 'manage_users');
    if (achievement[0].user_id !== req.user.id && !canManage) {
      return res.status(403).json({ error: 'Can only delete your own achievements' });
    }
    
    // Delete achievement
    await db.run('DELETE FROM achievements WHERE id = ?', [achievementId]);
    
    // Delete image file if exists
    if (achievement[0].image_url) {
      const imagePath = path.join(__dirname, '..', '..', 'public', achievement[0].image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    logger.info(`Achievement ${achievementId} deleted by user ${req.user.id}`);
    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get achievement statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { groupId } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (groupId) {
      whereClause = 'WHERE u.group_id = ?';
      params.push(groupId);
    }
    
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_achievements,
        COUNT(DISTINCT a.user_id) as users_with_achievements,
        COALESCE(SUM(a.points_earned), 0) as total_points_from_achievements,
        COALESCE(AVG(a.points_earned), 0) as avg_points_per_achievement
      FROM achievements a
      JOIN users u ON a.user_id = u.id
      ${whereClause}
    `, params);
    
    res.json({ stats: stats[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
