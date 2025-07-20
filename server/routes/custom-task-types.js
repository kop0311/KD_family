const express = require('express');
const { getDatabase } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const logger = require('../utils/logger');

const router = express.Router();

// Get all custom task types
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { groupId, includeInactive } = req.query;
    
    let whereClause = 'WHERE ctt.is_active = TRUE';
    let params = [];
    
    if (includeInactive === 'true') {
      whereClause = '';
    }
    
    if (groupId) {
      whereClause += whereClause ? ' AND' : 'WHERE';
      whereClause += ' (ctt.group_id = ? OR ctt.group_id IS NULL)';
      params.push(groupId);
    }
    
    const taskTypes = await db.query(`
      SELECT 
        ctt.id, ctt.code, ctt.name, ctt.description, ctt.default_points,
        ctt.category, ctt.icon, ctt.color, ctt.group_id, ctt.is_active,
        ctt.created_at, ctt.updated_at,
        u.username as created_by_username, u.full_name as created_by_name,
        fg.name as group_name
      FROM custom_task_types ctt
      LEFT JOIN users u ON ctt.created_by = u.id
      LEFT JOIN family_groups fg ON ctt.group_id = fg.id
      ${whereClause}
      ORDER BY ctt.category, ctt.name
    `, params);
    
    res.json({ taskTypes });
  } catch (error) {
    next(error);
  }
});

// Get specific task type
router.get('/:taskTypeId', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskTypeId } = req.params;
    
    const taskType = await db.query(`
      SELECT 
        ctt.id, ctt.code, ctt.name, ctt.description, ctt.default_points,
        ctt.category, ctt.icon, ctt.color, ctt.group_id, ctt.is_active,
        ctt.created_at, ctt.updated_at,
        u.username as created_by_username, u.full_name as created_by_name,
        fg.name as group_name
      FROM custom_task_types ctt
      LEFT JOIN users u ON ctt.created_by = u.id
      LEFT JOIN family_groups fg ON ctt.group_id = fg.id
      WHERE ctt.id = ?
    `, [taskTypeId]);
    
    if (taskType.length === 0) {
      return res.status(404).json({ error: 'Task type not found' });
    }
    
    res.json({ taskType: taskType[0] });
  } catch (error) {
    next(error);
  }
});

// Create custom task type
router.post('/', authenticateToken, requirePermission('manage_task_types'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { 
      code, name, description, defaultPoints, category, 
      icon, color, groupId 
    } = req.body;
    
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    
    // Validate code format (uppercase, max 10 chars)
    if (!/^[A-Z0-9_]{1,10}$/.test(code)) {
      return res.status(400).json({ error: 'Code must be uppercase letters, numbers, or underscores (max 10 chars)' });
    }
    
    // Check if code already exists
    const existing = await db.query('SELECT id FROM custom_task_types WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Task type code already exists' });
    }
    
    // Validate color format if provided
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return res.status(400).json({ error: 'Color must be in hex format (#RRGGBB)' });
    }
    
    // Create task type
    const result = await db.run(`
      INSERT INTO custom_task_types 
      (code, name, description, default_points, category, icon, color, group_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code,
      name,
      description || null,
      parseInt(defaultPoints) || 10,
      category || 'General',
      icon || '📋',
      color || '#6366f1',
      groupId || null,
      req.user.id
    ]);
    
    logger.info(`Custom task type "${code}" created by user ${req.user.id}`);
    res.json({
      message: 'Task type created successfully',
      taskTypeId: result.id
    });
  } catch (error) {
    next(error);
  }
});

// Update custom task type
router.put('/:taskTypeId', authenticateToken, requirePermission('manage_task_types'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskTypeId } = req.params;
    const { 
      name, description, defaultPoints, category, 
      icon, color, groupId, isActive 
    } = req.body;
    
    // Check if task type exists
    const taskType = await db.query('SELECT id, created_by FROM custom_task_types WHERE id = ?', [taskTypeId]);
    if (taskType.length === 0) {
      return res.status(404).json({ error: 'Task type not found' });
    }
    
    // Validate color format if provided
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return res.status(400).json({ error: 'Color must be in hex format (#RRGGBB)' });
    }
    
    // Build update query
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (defaultPoints !== undefined) updates.default_points = parseInt(defaultPoints);
    if (category !== undefined) updates.category = category;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (groupId !== undefined) updates.group_id = groupId;
    if (isActive !== undefined) updates.is_active = isActive;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.updated_at = 'CURRENT_TIMESTAMP';
    
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), taskTypeId];
    
    await db.run(`UPDATE custom_task_types SET ${setClause} WHERE id = ?`, values);
    
    logger.info(`Custom task type ${taskTypeId} updated by user ${req.user.id}`);
    res.json({ message: 'Task type updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete custom task type
router.delete('/:taskTypeId', authenticateToken, requirePermission('manage_task_types'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskTypeId } = req.params;
    
    // Check if task type is being used
    const tasksUsingType = await db.query('SELECT COUNT(*) as count FROM tasks WHERE task_type_id = ?', [taskTypeId]);
    if (tasksUsingType[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete task type that is being used by existing tasks. Deactivate it instead.' 
      });
    }
    
    // Delete task type
    const result = await db.run('DELETE FROM custom_task_types WHERE id = ?', [taskTypeId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task type not found' });
    }
    
    logger.info(`Custom task type ${taskTypeId} deleted by user ${req.user.id}`);
    res.json({ message: 'Task type deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get task templates for a task type
router.get('/:taskTypeId/templates', authenticateToken, async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskTypeId } = req.params;
    
    const templates = await db.query(`
      SELECT 
        tt.id, tt.name, tt.description, tt.default_points, tt.recurrence_pattern,
        tt.group_id, tt.is_active, tt.created_at,
        u.username as created_by_username, u.full_name as created_by_name,
        fg.name as group_name
      FROM task_templates tt
      LEFT JOIN users u ON tt.created_by = u.id
      LEFT JOIN family_groups fg ON tt.group_id = fg.id
      WHERE tt.task_type_id = ? AND tt.is_active = TRUE
      ORDER BY tt.name
    `, [taskTypeId]);
    
    res.json({ templates });
  } catch (error) {
    next(error);
  }
});

// Create task template
router.post('/:taskTypeId/templates', authenticateToken, requirePermission('manage_task_types'), async (req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskTypeId } = req.params;
    const { name, description, defaultPoints, recurrencePattern, groupId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Template name is required' });
    }
    
    // Check if task type exists
    const taskType = await db.query('SELECT id FROM custom_task_types WHERE id = ?', [taskTypeId]);
    if (taskType.length === 0) {
      return res.status(404).json({ error: 'Task type not found' });
    }
    
    // Create template
    const result = await db.run(`
      INSERT INTO task_templates 
      (name, description, task_type_id, default_points, recurrence_pattern, group_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      description || null,
      taskTypeId,
      parseInt(defaultPoints) || null,
      recurrencePattern || null,
      groupId || null,
      req.user.id
    ]);
    
    logger.info(`Task template "${name}" created for task type ${taskTypeId} by user ${req.user.id}`);
    res.json({
      message: 'Task template created successfully',
      templateId: result.id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
