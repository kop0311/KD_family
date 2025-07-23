// 任务模型 - PostgreSQL 适配版本
const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');

class Task {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.taskTypeId = data.task_type_id;
    this.status = data.status;
    this.points = data.points;
    this.assignedTo = data.assigned_to;
    this.createdBy = data.created_by;
    this.approvedBy = data.approved_by;
    this.dueDate = data.due_date;
    this.completedAt = data.completed_at;
    this.approvedAt = data.approved_at;
    this.isRecurring = data.is_recurring;
    this.recurrencePattern = data.recurrence_pattern;
    this.metadata = data.metadata || {};
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // 创建新任务
  static async create(taskData) {
    try {
      const {
        title,
        description,
        taskTypeId,
        points = 10,
        createdBy,
        dueDate = null,
        isRecurring = false,
        recurrencePattern = null,
        metadata = {}
      } = taskData;

      const sql = `
        INSERT INTO tasks (
          title, description, task_type_id, points, created_by, 
          due_date, is_recurring, recurrence_pattern, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await query(sql, [
        title, description, taskTypeId, points, createdBy,
        dueDate, isRecurring, recurrencePattern, JSON.stringify(metadata)
      ]);

      if (result.length > 0) {
        return new Task(result[0]);
      }

      throw new Error('任务创建失败');
    } catch (error) {
      logger.error('创建任务失败:', error);
      throw error;
    }
  }

  // 根据 ID 查找任务
  static async findById(id) {
    try {
      const sql = `
        SELECT 
          t.*,
          tt.name as task_type_name,
          tt.code as task_type_code,
          u1.username as assigned_to_username,
          u1.full_name as assigned_to_name,
          u2.username as created_by_username,
          u2.full_name as created_by_name
        FROM tasks t
        LEFT JOIN task_types tt ON t.task_type_id = tt.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        WHERE t.id = $1
      `;

      const result = await query(sql, [id]);

      if (result.length > 0) {
        const task = new Task(result[0]);
        task.taskType = {
          id: result[0].task_type_id,
          name: result[0].task_type_name,
          code: result[0].task_type_code
        };
        task.assignedToUser = result[0].assigned_to ? {
          id: result[0].assigned_to,
          username: result[0].assigned_to_username,
          fullName: result[0].assigned_to_name
        } : null;
        task.createdByUser = {
          id: result[0].created_by,
          username: result[0].created_by_username,
          fullName: result[0].created_by_name
        };
        return task;
      }

      return null;
    } catch (error) {
      logger.error('查找任务失败:', error);
      throw error;
    }
  }

  // 获取任务列表（支持过滤和分页）
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status = null,
        assignedTo = null,
        createdBy = null,
        taskType = null,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        search = null,
        dueBefore = null,
        dueAfter = null
      } = options;

      const offset = (page - 1) * limit;
      let sql = `
        SELECT 
          t.*,
          tt.name as task_type_name,
          tt.code as task_type_code,
          u1.username as assigned_to_username,
          u1.full_name as assigned_to_name,
          u2.username as created_by_username,
          u2.full_name as created_by_name
        FROM tasks t
        LEFT JOIN task_types tt ON t.task_type_id = tt.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
      `;

      let params = [];
      let whereConditions = [];

      // 状态过滤
      if (status) {
        whereConditions.push(`t.status = $${params.length + 1}`);
        params.push(status);
      }

      // 分配给用户过滤
      if (assignedTo) {
        whereConditions.push(`t.assigned_to = $${params.length + 1}`);
        params.push(assignedTo);
      }

      // 创建者过滤
      if (createdBy) {
        whereConditions.push(`t.created_by = $${params.length + 1}`);
        params.push(createdBy);
      }

      // 任务类型过滤
      if (taskType) {
        whereConditions.push(`t.task_type_id = $${params.length + 1}`);
        params.push(taskType);
      }

      // 搜索条件（PostgreSQL 全文搜索）
      if (search) {
        whereConditions.push(`(
          t.title ILIKE $${params.length + 1} OR 
          t.description ILIKE $${params.length + 1}
        )`);
        params.push(`%${search}%`);
      }

      // 截止日期过滤
      if (dueBefore) {
        whereConditions.push(`t.due_date <= $${params.length + 1}`);
        params.push(dueBefore);
      }

      if (dueAfter) {
        whereConditions.push(`t.due_date >= $${params.length + 1}`);
        params.push(dueAfter);
      }

      if (whereConditions.length > 0) {
        sql += ' WHERE ' + whereConditions.join(' AND ');
      }

      // 排序
      const allowedSortFields = ['created_at', 'updated_at', 'due_date', 'points', 'title'];
      const sortField = allowedSortFields.includes(sortBy) ? `t.${sortBy}` : 't.created_at';
      sql += ` ORDER BY ${sortField} ${sortOrder}`;

      // 分页
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(sql, params);

      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM tasks t';
      let countParams = [];
      let countWhereConditions = [];

      // 重复过滤条件（用于计数）
      if (status) {
        countWhereConditions.push(`t.status = $${countParams.length + 1}`);
        countParams.push(status);
      }

      if (assignedTo) {
        countWhereConditions.push(`t.assigned_to = $${countParams.length + 1}`);
        countParams.push(assignedTo);
      }

      if (createdBy) {
        countWhereConditions.push(`t.created_by = $${countParams.length + 1}`);
        countParams.push(createdBy);
      }

      if (taskType) {
        countWhereConditions.push(`t.task_type_id = $${countParams.length + 1}`);
        countParams.push(taskType);
      }

      if (search) {
        countWhereConditions.push(`(
          t.title ILIKE $${countParams.length + 1} OR 
          t.description ILIKE $${countParams.length + 1}
        )`);
        countParams.push(`%${search}%`);
      }

      if (dueBefore) {
        countWhereConditions.push(`t.due_date <= $${countParams.length + 1}`);
        countParams.push(dueBefore);
      }

      if (dueAfter) {
        countWhereConditions.push(`t.due_date >= $${countParams.length + 1}`);
        countParams.push(dueAfter);
      }

      if (countWhereConditions.length > 0) {
        countSql += ' WHERE ' + countWhereConditions.join(' AND ');
      }

      const countResult = await query(countSql, countParams);
      const total = parseInt(countResult[0].total);

      // 处理结果
      const tasks = result.map(row => {
        const task = new Task(row);
        task.taskType = {
          id: row.task_type_id,
          name: row.task_type_name,
          code: row.task_type_code
        };
        task.assignedToUser = row.assigned_to ? {
          id: row.assigned_to,
          username: row.assigned_to_username,
          fullName: row.assigned_to_name
        } : null;
        task.createdByUser = {
          id: row.created_by,
          username: row.created_by_username,
          fullName: row.created_by_name
        };
        return task;
      });

      return {
        tasks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('获取任务列表失败:', error);
      throw error;
    }
  }

  // 获取过期任务
  static async getOverdueTasks() {
    try {
      const sql = `
        SELECT t.*, u.username, u.full_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.due_date < CURRENT_TIMESTAMP 
          AND t.status NOT IN ('completed', 'approved', 'rejected')
        ORDER BY t.due_date ASC
      `;

      const result = await query(sql);
      return result.map(row => {
        const task = new Task(row);
        task.assignedToUser = row.assigned_to ? {
          id: row.assigned_to,
          username: row.username,
          fullName: row.full_name
        } : null;
        return task;
      });
    } catch (error) {
      logger.error('获取过期任务失败:', error);
      throw error;
    }
  }

  // 更新任务状态
  async updateStatus(newStatus, userId = null) {
    try {
      return await transaction(async (client) => {
        let sql = `
          UPDATE tasks 
          SET status = $1, updated_at = CURRENT_TIMESTAMP
        `;
        let params = [newStatus];

        // 根据状态更新相应字段
        if (newStatus === 'completed') {
          sql += `, completed_at = CURRENT_TIMESTAMP`;
        } else if (newStatus === 'approved' && userId) {
          sql += `, approved_by = $${params.length + 1}, approved_at = CURRENT_TIMESTAMP`;
          params.push(userId);
        } else if (newStatus === 'claimed' && userId) {
          sql += `, assigned_to = $${params.length + 1}`;
          params.push(userId);
        }

        sql += ` WHERE id = $${params.length + 1} RETURNING *`;
        params.push(this.id);

        const result = await client.query(sql, params);

        if (result.rows.length > 0) {
          Object.assign(this, result.rows[0]);

          // 如果任务被批准，添加积分记录
          if (newStatus === 'approved' && this.assignedTo) {
            const pointsSql = `
              INSERT INTO points_history (user_id, task_id, points_change, reason, created_by)
              VALUES ($1, $2, $3, $4, $5)
            `;
            await client.query(pointsSql, [
              this.assignedTo,
              this.id,
              this.points,
              `完成任务: ${this.title}`,
              userId
            ]);
          }

          return this;
        }

        throw new Error('任务状态更新失败');
      });
    } catch (error) {
      logger.error('更新任务状态失败:', error);
      throw error;
    }
  }

  // 更新任务信息
  async update(updateData) {
    try {
      const allowedFields = ['title', 'description', 'points', 'due_date', 'metadata'];
      const updates = [];
      const params = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          if (key === 'metadata') {
            updates.push(`${key} = $${params.length + 1}`);
            params.push(JSON.stringify(value));
          } else {
            updates.push(`${key} = $${params.length + 1}`);
            params.push(value);
          }
        }
      }

      if (updates.length === 0) {
        throw new Error('没有有效的更新字段');
      }

      params.push(this.id);

      const sql = `
        UPDATE tasks 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${params.length}
        RETURNING *
      `;

      const result = await query(sql, params);

      if (result.length > 0) {
        Object.assign(this, result[0]);
        return this;
      }

      throw new Error('任务更新失败');
    } catch (error) {
      logger.error('更新任务失败:', error);
      throw error;
    }
  }

  // 删除任务
  async delete() {
    try {
      return await transaction(async (client) => {
        // 删除相关的积分记录
        await client.query('DELETE FROM points_history WHERE task_id = $1', [this.id]);

        // 删除任务
        const result = await client.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [this.id]);

        if (result.rows.length > 0) {
          return result.rows[0];
        }

        throw new Error('任务删除失败');
      });
    } catch (error) {
      logger.error('删除任务失败:', error);
      throw error;
    }
  }

  // 转换为 JSON
  toJSON() {
    return {
      ...this,
      metadata: typeof this.metadata === 'string' ? JSON.parse(this.metadata) : this.metadata
    };
  }
}

module.exports = Task;
