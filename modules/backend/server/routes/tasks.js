// 任务路由 - PostgreSQL 适配版本
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateTaskCreation, validateTaskUpdate } = require('../middleware/validation');
const logger = require('../utils/logger');

// 获取任务列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      assignedTo,
      taskType,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      dueBefore,
      dueAfter
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // 限制最大页面大小
      sortBy,
      sortOrder: sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    };

    // 添加过滤条件
    if (status) options.status = status;
    if (assignedTo) options.assignedTo = parseInt(assignedTo);
    if (taskType) options.taskType = parseInt(taskType);
    if (search) options.search = search;
    if (dueBefore) options.dueBefore = dueBefore;
    if (dueAfter) options.dueAfter = dueAfter;

    const result = await Task.findAll(options);

    res.json({
      success: true,
      data: result.tasks,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取单个任务
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: '无效的任务ID'
      });
    }

    const task = await Task.findById(parseInt(id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error('获取任务失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 创建新任务
router.post('/', authenticateToken, requireRole(['advisor', 'parent']), validateTaskCreation, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.user.id
    };

    const task = await Task.create(taskData);

    res.status(201).json({
      success: true,
      message: '任务创建成功',
      data: task
    });
  } catch (error) {
    logger.error('创建任务失败:', error);
    
    // 处理数据库约束错误
    if (error.code === '23503') { // PostgreSQL 外键约束错误
      return res.status(400).json({
        success: false,
        message: '任务类型不存在'
      });
    }

    res.status(500).json({
      success: false,
      message: '创建任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 更新任务
router.put('/:id', authenticateToken, validateTaskUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: '无效的任务ID'
      });
    }

    const task = await Task.findById(parseInt(id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 检查权限：只有创建者或管理员可以更新任务
    if (task.createdBy !== req.user.id && !['advisor', 'parent'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '没有权限更新此任务'
      });
    }

    const updatedTask = await task.update(req.body);

    res.json({
      success: true,
      message: '任务更新成功',
      data: updatedTask
    });
  } catch (error) {
    logger.error('更新任务失败:', error);
    res.status(500).json({
      success: false,
      message: '更新任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 认领任务
router.patch('/:id/claim', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: '无效的任务ID'
      });
    }

    const task = await Task.findById(parseInt(id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    if (task.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只能认领待处理的任务'
      });
    }

    if (task.assignedTo && task.assignedTo !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: '任务已被其他用户认领'
      });
    }

    const updatedTask = await task.updateStatus('claimed', req.user.id);

    res.json({
      success: true,
      message: '任务认领成功',
      data: updatedTask
    });
  } catch (error) {
    logger.error('认领任务失败:', error);
    res.status(500).json({
      success: false,
      message: '认领任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 完成任务
router.patch('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: '无效的任务ID'
      });
    }

    const task = await Task.findById(parseInt(id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    if (task.assignedTo !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能完成分配给自己的任务'
      });
    }

    if (!['claimed', 'in_progress'].includes(task.status)) {
      return res.status(400).json({
        success: false,
        message: '只能完成已认领或进行中的任务'
      });
    }

    const updatedTask = await task.updateStatus('completed');

    res.json({
      success: true,
      message: '任务完成成功',
      data: updatedTask
    });
  } catch (error) {
    logger.error('完成任务失败:', error);
    res.status(500).json({
      success: false,
      message: '完成任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 批准任务
router.patch('/:id/approve', authenticateToken, requireRole(['advisor', 'parent']), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: '无效的任务ID'
      });
    }

    const task = await Task.findById(parseInt(id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: '只能批准已完成的任务'
      });
    }

    const updatedTask = await task.updateStatus('approved', req.user.id);

    res.json({
      success: true,
      message: '任务批准成功',
      data: updatedTask
    });
  } catch (error) {
    logger.error('批准任务失败:', error);
    res.status(500).json({
      success: false,
      message: '批准任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 拒绝任务
router.patch('/:id/reject', authenticateToken, requireRole(['advisor', 'parent']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: '无效的任务ID'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供拒绝原因'
      });
    }

    const task = await Task.findById(parseInt(id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: '只能拒绝已完成的任务'
      });
    }

    // 更新任务状态并添加拒绝原因到元数据
    const updatedMetadata = {
      ...task.metadata,
      rejectionReason: reason,
      rejectedBy: req.user.id,
      rejectedAt: new Date().toISOString()
    };

    await task.update({ metadata: updatedMetadata });
    const updatedTask = await task.updateStatus('rejected', req.user.id);

    res.json({
      success: true,
      message: '任务已拒绝',
      data: updatedTask
    });
  } catch (error) {
    logger.error('拒绝任务失败:', error);
    res.status(500).json({
      success: false,
      message: '拒绝任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 删除任务
router.delete('/:id', authenticateToken, requireRole(['advisor', 'parent']), async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: '无效的任务ID'
      });
    }

    const task = await Task.findById(parseInt(id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    // 检查权限：只有创建者或管理员可以删除任务
    if (task.createdBy !== req.user.id && req.user.role !== 'advisor') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此任务'
      });
    }

    await task.delete();

    res.json({
      success: true,
      message: '任务删除成功'
    });
  } catch (error) {
    logger.error('删除任务失败:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 获取过期任务
router.get('/overdue/list', authenticateToken, requireRole(['advisor', 'parent']), async (req, res) => {
  try {
    const overdueTasks = await Task.getOverdueTasks();

    res.json({
      success: true,
      data: overdueTasks,
      count: overdueTasks.length
    });
  } catch (error) {
    logger.error('获取过期任务失败:', error);
    res.status(500).json({
      success: false,
      message: '获取过期任务失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
