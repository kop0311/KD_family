// 用户模型 - PostgreSQL 适配版本
const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.password_hash;
    this.fullName = data.full_name;
    this.role = data.role;
    this.avatarUrl = data.avatar_url;
    this.bio = data.bio;
    this.totalPoints = data.total_points;
    this.level = data.level;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // 创建新用户
  static async create(userData) {
    try {
      const { username, email, password, fullName, role = 'member' } = userData;
      
      // 加密密码
      const passwordHash = await bcrypt.hash(password, 12);
      
      // PostgreSQL 使用 RETURNING 子句返回插入的记录
      const sql = `
        INSERT INTO users (username, email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await query(sql, [username, email, passwordHash, fullName, role]);
      
      if (result.length > 0) {
        return new User(result[0]);
      }
      
      throw new Error('用户创建失败');
    } catch (error) {
      logger.error('创建用户失败:', error);
      throw error;
    }
  }

  // 根据 ID 查找用户
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM users WHERE id = $1';
      const result = await query(sql, [id]);
      
      if (result.length > 0) {
        return new User(result[0]);
      }
      
      return null;
    } catch (error) {
      logger.error('查找用户失败:', error);
      throw error;
    }
  }

  // 根据用户名查找用户
  static async findByUsername(username) {
    try {
      const sql = 'SELECT * FROM users WHERE username = $1';
      const result = await query(sql, [username]);
      
      if (result.length > 0) {
        return new User(result[0]);
      }
      
      return null;
    } catch (error) {
      logger.error('查找用户失败:', error);
      throw error;
    }
  }

  // 根据邮箱查找用户
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = $1';
      const result = await query(sql, [email]);
      
      if (result.length > 0) {
        return new User(result[0]);
      }
      
      return null;
    } catch (error) {
      logger.error('查找用户失败:', error);
      throw error;
    }
  }

  // 获取用户列表（支持分页和排序）
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        role = null,
        search = null
      } = options;

      const offset = (page - 1) * limit;
      let sql = 'SELECT * FROM users';
      let params = [];
      let whereConditions = [];

      // 添加角色过滤
      if (role) {
        whereConditions.push(`role = $${params.length + 1}`);
        params.push(role);
      }

      // 添加搜索条件（PostgreSQL 全文搜索）
      if (search) {
        whereConditions.push(`(
          username ILIKE $${params.length + 1} OR 
          full_name ILIKE $${params.length + 1} OR 
          email ILIKE $${params.length + 1}
        )`);
        params.push(`%${search}%`);
      }

      if (whereConditions.length > 0) {
        sql += ' WHERE ' + whereConditions.join(' AND ');
      }

      // PostgreSQL 排序语法
      sql += ` ORDER BY ${sortBy} ${sortOrder}`;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await query(sql, params);
      
      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM users';
      let countParams = [];
      
      if (role) {
        countSql += ' WHERE role = $1';
        countParams.push(role);
      }
      
      if (search) {
        const whereClause = role ? ' AND ' : ' WHERE ';
        countSql += whereClause + `(
          username ILIKE $${countParams.length + 1} OR 
          full_name ILIKE $${countParams.length + 1} OR 
          email ILIKE $${countParams.length + 1}
        )`;
        countParams.push(`%${search}%`);
      }

      const countResult = await query(countSql, countParams);
      const total = parseInt(countResult[0].total);

      return {
        users: result.map(row => new User(row)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      throw error;
    }
  }

  // 获取排行榜
  static async getLeaderboard(period = 'all', limit = 10) {
    try {
      let sql = `
        SELECT 
          u.*,
          COALESCE(SUM(ph.points_change), 0) as period_points,
          COUNT(t.id) as completed_tasks,
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ph.points_change), 0) DESC) as rank
        FROM users u
        LEFT JOIN points_history ph ON u.id = ph.user_id
        LEFT JOIN tasks t ON u.id = t.assigned_to AND t.status = 'approved'
      `;

      let params = [];

      // 根据时间段过滤（PostgreSQL 日期函数）
      if (period === 'week') {
        sql += ` AND ph.created_at >= DATE_TRUNC('week', CURRENT_TIMESTAMP)`;
      } else if (period === 'month') {
        sql += ` AND ph.created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)`;
      }

      sql += `
        GROUP BY u.id
        ORDER BY period_points DESC, u.total_points DESC
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const result = await query(sql, params);
      
      return result.map(row => ({
        ...new User(row),
        periodPoints: parseInt(row.period_points),
        completedTasks: parseInt(row.completed_tasks),
        rank: parseInt(row.rank)
      }));
    } catch (error) {
      logger.error('获取排行榜失败:', error);
      throw error;
    }
  }

  // 更新用户信息
  async update(updateData) {
    try {
      const allowedFields = ['full_name', 'bio', 'avatar_url'];
      const updates = [];
      const params = [];
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = $${params.length + 1}`);
          params.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('没有有效的更新字段');
      }

      params.push(this.id);
      
      const sql = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${params.length}
        RETURNING *
      `;

      const result = await query(sql, params);
      
      if (result.length > 0) {
        Object.assign(this, result[0]);
        return this;
      }
      
      throw new Error('用户更新失败');
    } catch (error) {
      logger.error('更新用户失败:', error);
      throw error;
    }
  }

  // 验证密码
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.passwordHash);
    } catch (error) {
      logger.error('密码验证失败:', error);
      throw error;
    }
  }

  // 更新密码
  async updatePassword(newPassword) {
    try {
      const passwordHash = await bcrypt.hash(newPassword, 12);
      
      const sql = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await query(sql, [passwordHash, this.id]);
      
      if (result.length > 0) {
        this.passwordHash = result[0].password_hash;
        return this;
      }
      
      throw new Error('密码更新失败');
    } catch (error) {
      logger.error('更新密码失败:', error);
      throw error;
    }
  }

  // 删除用户（软删除）
  async delete() {
    try {
      // PostgreSQL 支持事务
      return await transaction(async (client) => {
        // 标记用户为已删除（添加删除时间戳）
        const sql = `
          UPDATE users 
          SET 
            username = username || '_deleted_' || EXTRACT(EPOCH FROM NOW())::text,
            email = email || '_deleted_' || EXTRACT(EPOCH FROM NOW())::text,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;

        const result = await client.query(sql, [this.id]);
        
        if (result.rows.length > 0) {
          return result.rows[0];
        }
        
        throw new Error('用户删除失败');
      });
    } catch (error) {
      logger.error('删除用户失败:', error);
      throw error;
    }
  }

  // 转换为 JSON（隐藏敏感信息）
  toJSON() {
    const { passwordHash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
