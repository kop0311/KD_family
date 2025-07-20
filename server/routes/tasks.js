const express = require('express');
const Joi = require('joi');
const { getDatabase } = require('../database/connection');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000),
  taskType: Joi.string().valid('PM', 'FTL', 'PA', 'UBI').required(),
  assignedTo: Joi.number().integer(),
  points: Joi.number().integer().min(1).max(100),
  dueDate: Joi.date(),
  isRecurring: Joi.boolean().default(false),
  recurrencePattern: Joi.string().valid('daily', 'weekly', 'monthly')
});

const updateTaskStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'claimed', 'in_progress', 'completed', 'approved').required()
});

const assignTaskSchema = Joi.object({
  userId: Joi.number().integer().required()
});

router.get('/', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();


    const { status, taskType, assignedTo, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereConditions = [];
    const params = [];

    if (status) {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    if (taskType) {
      whereConditions.push('tt.code = ?');
      params.push(taskType);
    }

    if (assignedTo) {
      whereConditions.push('t.assigned_to = ?');
      params.push(assignedTo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const finalParams = [...params, parseInt(limit), offset];
    const tasks = await db.query(`
      SELECT
        t.id, t.title, t.description, t.status, t.points, t.due_date, t.completed_at, t.approved_at,
        t.is_recurring, t.recurrence_pattern, t.created_at, t.updated_at,
        tt.code as task_type_code, tt.name as task_type_name,
        u_assigned.username as assigned_username, u_assigned.full_name as assigned_full_name,
        u_created.username as created_by_username, u_created.full_name as created_by_full_name,
        u_approved.username as approved_by_username, u_approved.full_name as approved_by_full_name
      FROM tasks t
      JOIN task_types tt ON t.task_type_id = tt.id
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      LEFT JOIN users u_approved ON t.approved_by = u_approved.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, finalParams);

    const totalCount = await db.query(`
      SELECT COUNT(*) as count
      FROM tasks t
      JOIN task_types tt ON t.task_type_id = tt.id
      ${whereClause}
    `, params);

    res.json({
      tasks,
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

// Get my tasks
router.get('/my', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const tasks = await db.query(`
      SELECT
        t.id, t.title, t.description, t.status, t.points, t.due_date, t.completed_at,
        t.created_at, t.updated_at,
        tt.code as task_type_code, tt.name as task_type_name
      FROM tasks t
      JOIN task_types tt ON t.task_type_id = tt.id
      WHERE t.assigned_to = ?
      ORDER BY
        CASE t.status
          WHEN 'in_progress' THEN 1
          WHEN 'claimed' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'approved' THEN 4
          ELSE 5
        END,
        t.due_date ASC, t.created_at DESC
    `, [req.user.id]);

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

router.get('/my-tasks', authenticateToken, async(req, res, next) => {
  req.url = '/my';
  return router.handle(req, res, next);
});

router.post('/', authenticateToken, (req, res, next) => {
  // Only advisor and parent can create tasks
  if (!['advisor', 'parent'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only advisors and parents can create tasks' });
  }
  next();
}, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { title, description, taskType, assignedTo, points, dueDate, isRecurring, recurrencePattern } = value;

    const taskTypes = await db.query('SELECT id, default_points FROM task_types WHERE code = ?', [taskType]);
    if (taskTypes.length === 0) {
      return res.status(400).json({ error: 'Invalid task type' });
    }

    const taskTypeId = taskTypes[0].id;
    const taskPoints = points || taskTypes[0].default_points;

    const result = await db.run(`
      INSERT INTO tasks (title, description, task_type_id, assigned_to, created_by, points, due_date, is_recurring, recurrence_pattern)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description, taskTypeId, assignedTo || null, req.user.id, taskPoints, dueDate || null, isRecurring, recurrencePattern || null]);

    if (assignedTo) {
      await db.run(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `, [assignedTo, 'New Task Assigned', `You have been assigned a new task: ${title}`, 'system']);
    }

    // Get the created task details
    const createdTask = await db.query(`
      SELECT
        t.id, t.title, t.description, t.status, t.points, t.due_date,
        t.is_recurring, t.recurrence_pattern, t.created_at, t.updated_at,
        tt.code as taskType, tt.name as task_type_name,
        u_assigned.id as assignedTo, u_assigned.username as assigned_username,
        u_created.id as createdBy, u_created.username as created_by_username
      FROM tasks t
      JOIN task_types tt ON t.task_type_id = tt.id
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      WHERE t.id = ?
    `, [result.id]);

    res.status(201).json({
      message: 'Task created successfully',
      task: createdTask[0]
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:taskId/claim', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;

    const tasks = await db.query('SELECT id, status, assigned_to FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];
    if (task.status !== 'pending') {
      return res.status(400).json({ error: 'Task cannot be claimed' });
    }

    if (task.assigned_to && task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Task is assigned to another user' });
    }

    await db.run(`
      UPDATE tasks
      SET assigned_to = ?, status = 'claimed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.id, taskId]);

    res.json({ message: 'Task claimed successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:taskId/assign', authenticateToken, (req, res, next) => {
  // Only advisor and parent can assign tasks
  if (!['advisor', 'parent'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only advisors and parents can assign tasks' });
  }
  next();
}, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;
    const { error, value } = assignTaskSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { userId } = value;

    await db.run(
      'UPDATE tasks SET assigned_to = ? WHERE id = ?',
      [userId, taskId]
    );

    res.json({ message: 'Task assigned successfully' });
  } catch (error) {
    next(error);
  }
});

router.put('/:taskId/status', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;
    const { error, value } = updateTaskStatusSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { status } = value;

    const tasks = await db.query('SELECT id, status, assigned_to, points FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];

    if (status === 'approved' && !['advisor', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins can approve tasks' });
    }

    if (task.assigned_to !== req.user.id && !['advisor', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'You can only update your own tasks' });
    }

    await db.query(async(connection) => {
      await connection.execute(`
        UPDATE tasks 
        SET status = ?, 
            ${status === 'completed' ? 'completed_at = CURRENT_TIMESTAMP,' : ''}
            ${status === 'approved' ? 'approved_at = CURRENT_TIMESTAMP, approved_by = ?,' : ''}
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, status === 'approved' ? [status, req.user.id, taskId] : [status, taskId]);

      if (status === 'approved' && task.status === 'completed') {
        const currentPoints = await connection.execute(
          'SELECT COALESCE(SUM(points_change), 0) as total FROM points_history WHERE user_id = ?',
          [task.assigned_to]
        );

        const newTotal = currentPoints[0][0].total + task.points;

        await connection.execute(`
          INSERT INTO points_history (user_id, task_id, points_change, total_points, reason)
          VALUES (?, ?, ?, ?, ?)
        `, [task.assigned_to, taskId, task.points, newTotal, `Task completed: ${task.title || 'Task #' + taskId}`]);

        await connection.execute(`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (?, ?, ?, ?)
        `, [task.assigned_to, 'Points Earned', `You earned ${task.points} points for completing a task!`, 'points_earned']);
      }
    });

    res.json({ message: 'Task status updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Get specific task
router.get('/:taskId', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;

    const tasks = await db.query(`
      SELECT
        t.id, t.title, t.description, t.status, t.points, t.due_date, t.completed_at, t.approved_at,
        t.is_recurring, t.recurrence_pattern, t.created_at, t.updated_at,
        tt.code as taskType, tt.name as task_type_name,
        u_assigned.id as assignedTo, u_assigned.username as assigned_username,
        u_created.id as createdBy, u_created.username as created_by_username,
        u_approved.id as approvedBy, u_approved.username as approved_by_username
      FROM tasks t
      JOIN task_types tt ON t.task_type_id = tt.id
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      LEFT JOIN users u_approved ON t.approved_by = u_approved.id
      WHERE t.id = ?
    `, [taskId]);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];

    // Convert field names to match test expectations
    const responseTask = {
      ...task,
      claimedBy: task.assignedTo
    };

    res.json(responseTask);
  } catch (error) {
    next(error);
  }
});

// Update task
router.put('/:taskId', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;
    const { title, description, points, dueDate } = req.body;

    // Check if task exists and user has permission
    const tasks = await db.query('SELECT created_by FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only creator or admin can update
    if (tasks[0].created_by !== req.user.id && !['advisor', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updates = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (points) updates.points = points;
    if (dueDate) updates.due_date = dueDate;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), taskId];

    await db.run(
      `UPDATE tasks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:taskId', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;

    // Check if task exists and user has permission
    const tasks = await db.query('SELECT created_by, status FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only creator or admin can delete, and only if not completed/approved
    if (tasks[0].created_by !== req.user.id && !['advisor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    if (['completed', 'approved'].includes(tasks[0].status)) {
      return res.status(400).json({ error: 'Cannot delete completed or approved tasks' });
    }

    await db.run('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Start task
router.put('/:taskId/start', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;

    const tasks = await db.query('SELECT id, status, assigned_to FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];
    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'You can only start your own tasks' });
    }

    if (task.status !== 'claimed') {
      return res.status(400).json({ error: 'Task must be claimed before starting' });
    }

    await db.run(`
      UPDATE tasks
      SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [taskId]);

    res.json({ message: 'Task started successfully' });
  } catch (error) {
    next(error);
  }
});

// Complete task
router.put('/:taskId/complete', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;

    const tasks = await db.query('SELECT id, status, assigned_to FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];
    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'You can only complete your own tasks' });
    }

    if (task.status !== 'in_progress') {
      return res.status(400).json({ error: 'Task must be in progress to complete' });
    }

    await db.run(`
      UPDATE tasks
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [taskId]);

    res.json({ message: 'Task completed successfully' });
  } catch (error) {
    next(error);
  }
});

// Approve task
router.put('/:taskId/approve', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;

    if (!['advisor', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only advisors and parents can approve tasks' });
    }

    const tasks = await db.query('SELECT id, status, assigned_to, points, title FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];
    if (task.status !== 'completed') {
      return res.status(400).json({ error: 'Task must be completed before approval' });
    }

    // Update task status
    await db.run(`
      UPDATE tasks
      SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.id, taskId]);

    // Add points to user
    await db.run(`
      INSERT INTO points_history (user_id, points_change, reason, created_by, task_id)
      VALUES (?, ?, ?, ?, ?)
    `, [task.assigned_to, task.points, `Task approved: ${task.title}`, req.user.id, taskId]);

    res.json({ message: 'Task approved successfully' });
  } catch (error) {
    next(error);
  }
});

// Reject task
router.put('/:taskId/reject', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const { taskId } = req.params;
    const { reason } = req.body;

    if (!['advisor', 'parent'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only advisors and parents can reject tasks' });
    }

    const tasks = await db.query('SELECT id, status FROM tasks WHERE id = ?', [taskId]);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[0];
    if (task.status !== 'completed') {
      return res.status(400).json({ error: 'Task must be completed before rejection' });
    }

    await db.run(`
      UPDATE tasks
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [taskId]);

    res.json({ message: 'Task rejected successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/types', authenticateToken, async(req, res, next) => {
  try {
    const db = await getDatabase();
    const taskTypes = await db.query('SELECT * FROM task_types ORDER BY code');
    res.json({ taskTypes });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
