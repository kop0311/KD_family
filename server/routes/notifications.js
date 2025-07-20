const express = require('express');
const { getDatabase } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (unreadOnly === 'true') {
      whereClause += ' AND is_read = FALSE';
    }

    const notifications = await db.db.query(`
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const totalCount = await db.db.query(`
      SELECT COUNT(*) as count
      FROM notifications
      ${whereClause}
    `, params);

    const unreadCount = await db.db.query(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND is_read = FALSE
    `, [req.user.id]);

    res.json({
      notifications,
      unreadCount: unreadCount[0].count,
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

router.put('/:notificationId/read', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { notificationId } = req.params;

    const result = await db.db.query(`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE id = ? AND user_id = ?
    `, [notificationId, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

router.put('/mark-all-read', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    await db.db.query(`
      UPDATE notifications 
      SET is_read = TRUE 
      WHERE user_id = ? AND is_read = FALSE
    `, [req.user.id]);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:notificationId', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { notificationId } = req.params;

    const result = await db.db.query(`
      DELETE FROM notifications 
      WHERE id = ? AND user_id = ?
    `, [notificationId, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
