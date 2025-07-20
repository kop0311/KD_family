const express = require('express');
const { getDatabase } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const logger = require('../utils/logger');

const router = express.Router();

// Get all family groups
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    
    const groups = await db.query(`
      SELECT 
        fg.id, fg.name, fg.description, fg.created_at,
        u.username as created_by_username, u.full_name as created_by_name,
        COUNT(ug.id) as member_count
      FROM family_groups fg
      LEFT JOIN users u ON fg.created_by = u.id
      LEFT JOIN users ug ON fg.id = ug.group_id
      GROUP BY fg.id
      ORDER BY fg.name
    `);
    
    res.json({ groups });
  } catch (error) {
    next(error);
  }
});

// Get specific group with members
router.get('/:groupId', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { groupId } = req.params;
    
    // Get group info
    const group = await db.query(`
      SELECT 
        fg.id, fg.name, fg.description, fg.created_at,
        u.username as created_by_username, u.full_name as created_by_name
      FROM family_groups fg
      LEFT JOIN users u ON fg.created_by = u.id
      WHERE fg.id = ?
    `, [groupId]);
    
    if (group.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Get group members
    const members = await db.query(`
      SELECT 
        u.id, u.username, u.full_name, u.primary_role, u.avatar_url,
        COALESCE(SUM(ph.points_change), 0) as total_points
      FROM users u
      LEFT JOIN points_history ph ON u.id = ph.user_id
      WHERE u.group_id = ?
      GROUP BY u.id
      ORDER BY total_points DESC
    `, [groupId]);
    
    res.json({
      group: group[0],
      members
    });
  } catch (error) {
    next(error);
  }
});

// Create new family group
router.post('/', authenticateToken, requirePermission('manage_groups'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    // Check if group name already exists
    const existing = await db.query('SELECT id FROM family_groups WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Group name already exists' });
    }
    
    // Create group
    const result = await db.run(
      'INSERT INTO family_groups (name, description, created_by) VALUES (?, ?, ?)',
      [name, description || null, req.user.id]
    );
    
    logger.info(`Family group "${name}" created by user ${req.user.id}`);
    res.json({ 
      message: 'Group created successfully',
      groupId: result.id
    });
  } catch (error) {
    next(error);
  }
});

// Update family group
router.put('/:groupId', authenticateToken, requirePermission('manage_groups'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { groupId } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    // Check if group exists
    const group = await db.query('SELECT id FROM family_groups WHERE id = ?', [groupId]);
    if (group.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Update group
    await db.run(
      'UPDATE family_groups SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description || null, groupId]
    );
    
    logger.info(`Family group ${groupId} updated by user ${req.user.id}`);
    res.json({ message: 'Group updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete family group
router.delete('/:groupId', authenticateToken, requirePermission('manage_groups'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { groupId } = req.params;
    
    // Check if group has members
    const members = await db.query('SELECT COUNT(*) as count FROM users WHERE group_id = ?', [groupId]);
    if (members[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete group with members. Remove all members first.' });
    }
    
    // Delete group
    const result = await db.run('DELETE FROM family_groups WHERE id = ?', [groupId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    logger.info(`Family group ${groupId} deleted by user ${req.user.id}`);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add user to group
router.post('/:groupId/members', authenticateToken, requirePermission('manage_groups'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { groupId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Check if group exists
    const group = await db.query('SELECT id FROM family_groups WHERE id = ?', [groupId]);
    if (group.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user exists
    const user = await db.query('SELECT id, group_id FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user[0].group_id) {
      return res.status(400).json({ error: 'User is already in a group' });
    }
    
    // Add user to group
    await db.run('UPDATE users SET group_id = ? WHERE id = ?', [groupId, userId]);
    
    logger.info(`User ${userId} added to group ${groupId} by user ${req.user.id}`);
    res.json({ message: 'User added to group successfully' });
  } catch (error) {
    next(error);
  }
});

// Remove user from group
router.delete('/:groupId/members/:userId', authenticateToken, requirePermission('manage_groups'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { groupId, userId } = req.params;
    
    // Remove user from group
    const result = await db.run('UPDATE users SET group_id = NULL WHERE id = ? AND group_id = ?', [userId, groupId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found in this group' });
    }
    
    logger.info(`User ${userId} removed from group ${groupId} by user ${req.user.id}`);
    res.json({ message: 'User removed from group successfully' });
  } catch (error) {
    next(error);
  }
});

// Get group statistics
router.get('/:groupId/stats', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { groupId } = req.params;
    
    // Get group stats
    const stats = await db.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_members,
        COALESCE(SUM(ph.points_change), 0) as total_points,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'approved' THEN t.id END) as completed_tasks
      FROM users u
      LEFT JOIN points_history ph ON u.id = ph.user_id
      LEFT JOIN tasks t ON u.id = t.assigned_to
      WHERE u.group_id = ?
    `, [groupId]);
    
    // Get top performers
    const topPerformers = await db.query(`
      SELECT 
        u.id, u.username, u.full_name, u.avatar_url,
        COALESCE(SUM(ph.points_change), 0) as total_points,
        COUNT(DISTINCT CASE WHEN t.status = 'approved' THEN t.id END) as completed_tasks
      FROM users u
      LEFT JOIN points_history ph ON u.id = ph.user_id
      LEFT JOIN tasks t ON u.id = t.assigned_to AND t.status = 'approved'
      WHERE u.group_id = ?
      GROUP BY u.id
      ORDER BY total_points DESC
      LIMIT 5
    `, [groupId]);
    
    res.json({
      stats: stats[0],
      topPerformers
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
