const express = require('express');
const { getDatabase } = require('../database/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/history', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const history = await db.query(`
      SELECT
        ph.id, ph.points_change, ph.total_points, ph.reason, ph.created_at,
        t.title as task_title, t.id as task_id,
        tt.code as task_type_code, tt.name as task_type_name
      FROM points_history ph
      LEFT JOIN tasks t ON ph.task_id = t.id
      LEFT JOIN task_types tt ON t.task_type_id = tt.id
      WHERE ph.user_id = ?
      ORDER BY ph.created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.id, parseInt(limit), offset]);

    const totalCount = await db.query(
      'SELECT COUNT(*) as count FROM points_history WHERE user_id = ?',
      [req.user.id]
    );

    const currentTotal = await db.db.query(
      'SELECT COALESCE(SUM(points_change), 0) as total FROM points_history WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      history,
      currentTotal: currentTotal[0].total,
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

router.get('/leaderboard', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { period = 'all', limit = 10 } = req.query;
    let dateFilter = '';
    const params = [];

    // SQLite date filtering
    if (period === 'week') {
      dateFilter = "AND ph.created_at >= datetime('now', '-7 days')";
    } else if (period === 'month') {
      dateFilter = "AND ph.created_at >= datetime('now', '-1 month')";
    }

    let taskDateFilter = '';
    if (period === 'week') {
      taskDateFilter = "AND t.approved_at >= datetime('now', '-7 days')";
    } else if (period === 'month') {
      taskDateFilter = "AND t.approved_at >= datetime('now', '-1 month')";
    }

    const leaderboard = await db.query(`
      SELECT
        u.id, u.username, u.full_name, u.avatar_url,
        COALESCE(SUM(ph.points_change), 0) as total_points,
        COUNT(DISTINCT t.id) as completed_tasks
      FROM users u
      LEFT JOIN points_history ph ON u.id = ph.user_id ${dateFilter}
      LEFT JOIN tasks t ON u.id = t.assigned_to AND t.status = 'approved' ${taskDateFilter}
      GROUP BY u.id
      ORDER BY total_points DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({ leaderboard, period });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const stats = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN ph.created_at >= datetime('now', '-7 days') THEN ph.points_change ELSE 0 END), 0) as week_points,
        COALESCE(SUM(CASE WHEN ph.created_at >= datetime('now', '-1 month') THEN ph.points_change ELSE 0 END), 0) as month_points,
        COALESCE(SUM(ph.points_change), 0) as total_points,
        COUNT(DISTINCT CASE WHEN t.approved_at >= datetime('now', '-7 days') THEN t.id END) as week_tasks,
        COUNT(DISTINCT CASE WHEN t.approved_at >= datetime('now', '-1 month') THEN t.id END) as month_tasks,
        COUNT(DISTINCT t.id) as total_tasks
      FROM points_history ph
      LEFT JOIN tasks t ON ph.task_id = t.id AND t.assigned_to = ph.user_id
      WHERE ph.user_id = ?
    `, [req.user.id]);

    const taskTypeStats = await db.query(`
      SELECT
        tt.code, tt.name,
        COUNT(t.id) as completed_count,
        COALESCE(SUM(t.points), 0) as total_points
      FROM task_types tt
      LEFT JOIN tasks t ON tt.id = t.task_type_id AND t.assigned_to = ? AND t.status = 'approved'
      GROUP BY tt.id
      ORDER BY total_points DESC
    `, [req.user.id]);

    res.json({
      stats: stats[0],
      taskTypeStats
    });
  } catch (error) {
    next(error);
  }
});

router.get('/weekly-settlements', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const settlements = await db.db.query(`
      SELECT 
        ws.id, ws.week_start_date, ws.week_end_date, ws.medal_image_url, ws.notes, ws.created_at,
        u.username as winner_username, u.full_name as winner_full_name, u.avatar_url as winner_avatar
      FROM weekly_settlements ws
      LEFT JOIN users u ON ws.winner_id = u.id
      ORDER BY ws.week_start_date DESC
      LIMIT 20
    `);

    res.json({ settlements });
  } catch (error) {
    next(error);
  }
});

router.post('/weekly-settlement', authenticateToken, requireAdmin, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { weekStartDate, weekEndDate, notes } = req.body;

    const weeklyLeaderboard = await db.query(`
      SELECT
        u.id, u.username, u.full_name,
        COALESCE(SUM(ph.points_change), 0) as total_points,
        COUNT(DISTINCT t.id) as completed_tasks
      FROM users u
      LEFT JOIN points_history ph ON u.id = ph.user_id
        AND ph.created_at >= ? AND ph.created_at <= ?
      LEFT JOIN tasks t ON u.id = t.assigned_to
        AND t.status = 'approved'
        AND t.approved_at >= ? AND t.approved_at <= ?
      GROUP BY u.id
      HAVING total_points > 0
      ORDER BY total_points DESC
    `, [weekStartDate, weekEndDate, weekStartDate, weekEndDate]);

    if (weeklyLeaderboard.length === 0) {
      return res.status(400).json({ error: 'No activity found for this week period' });
    }

    const winner = weeklyLeaderboard[0];

    const settlementResult = await db.db.query(`
      INSERT INTO weekly_settlements (week_start_date, week_end_date, winner_id, notes)
      VALUES (?, ?, ?, ?)
    `, [weekStartDate, weekEndDate, winner.id, notes]);

    const settlementId = settlementResult.insertId;

    for (let i = 0; i < weeklyLeaderboard.length; i++) {
      const user = weeklyLeaderboard[i];
      await db.db.query(`
        INSERT INTO weekly_rankings (settlement_id, user_id, rank_position, total_points, tasks_completed)
        VALUES (?, ?, ?, ?, ?)
      `, [settlementId, user.id, i + 1, user.total_points, user.completed_tasks]);
    }

    await db.db.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `, [winner.id, 'Weekly Champion!', `Congratulations! You won this week with ${winner.total_points} points!`, 'system']);

    res.json({
      message: 'Weekly settlement created successfully',
      settlementId,
      winner: winner.full_name,
      participants: weeklyLeaderboard.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
