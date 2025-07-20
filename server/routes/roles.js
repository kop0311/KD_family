const express = require('express');
const { getDatabase } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, canManageUser, getUserRoles, getUserPermissions } = require('../middleware/permissions');
const logger = require('../utils/logger');

const router = express.Router();

// Get user's roles and permissions
router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const roles = await getUserRoles(req.user.id);
    const permissions = await getUserPermissions(req.user.id);
    
    res.json({
      roles,
      permissions
    });
  } catch (error) {
    next(error);
  }
});

// Get roles for a specific user (admin only)
router.get('/user/:userId', authenticateToken, requirePermission('manage_users'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const roles = await getUserRoles(parseInt(userId));
    const permissions = await getUserPermissions(parseInt(userId));
    
    res.json({
      userId: parseInt(userId),
      roles,
      permissions
    });
  } catch (error) {
    next(error);
  }
});

// Assign role to user
router.post('/assign', authenticateToken, requirePermission('assign_roles'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }
    
    if (!['advisor', 'parent', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if user exists
    const user = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if role already assigned
    const existingRole = await db.query('SELECT id FROM user_roles WHERE user_id = ? AND role = ?', [userId, role]);
    if (existingRole.length > 0) {
      return res.status(400).json({ error: 'Role already assigned to user' });
    }
    
    // Assign role
    await db.run(
      'INSERT INTO user_roles (user_id, role, granted_by) VALUES (?, ?, ?)',
      [userId, role, req.user.id]
    );
    
    logger.info(`Role ${role} assigned to user ${userId} by ${req.user.id}`);
    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    next(error);
  }
});

// Remove role from user
router.delete('/remove', authenticateToken, requirePermission('assign_roles'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }
    
    // Cannot remove primary role
    const user = await db.query('SELECT primary_role FROM users WHERE id = ?', [userId]);
    if (user.length > 0 && user[0].primary_role === role) {
      return res.status(400).json({ error: 'Cannot remove primary role' });
    }
    
    // Remove role
    const result = await db.run('DELETE FROM user_roles WHERE user_id = ? AND role = ?', [userId, role]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Role assignment not found' });
    }
    
    logger.info(`Role ${role} removed from user ${userId} by ${req.user.id}`);
    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    next(error);
  }
});

// Update primary role
router.put('/primary', authenticateToken, requirePermission('assign_roles'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }
    
    if (!['advisor', 'parent', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Update primary role
    const result = await db.run('UPDATE users SET primary_role = ? WHERE id = ?', [role, userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info(`Primary role updated to ${role} for user ${userId} by ${req.user.id}`);
    res.json({ message: 'Primary role updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Get all users with their roles (admin only)
router.get('/users', authenticateToken, requirePermission('manage_users'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    
    const users = await db.query(`
      SELECT 
        u.id, u.username, u.full_name, u.email, u.primary_role, u.group_id,
        GROUP_CONCAT(ur.role) as additional_roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      GROUP BY u.id
      ORDER BY u.full_name
    `);
    
    // Process additional roles
    const processedUsers = users.map(user => ({
      ...user,
      additional_roles: user.additional_roles ? user.additional_roles.split(',') : []
    }));
    
    res.json({ users: processedUsers });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
