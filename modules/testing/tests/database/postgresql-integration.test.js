// PostgreSQL 集成测试
const { Pool } = require('pg');
const User = require('../../server/models/User');
const Task = require('../../server/models/Task');

describe('PostgreSQL 集成测试', () => {
  let pool;
  
  beforeAll(async () => {
    // 使用测试数据库配置
    pool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: process.env.TEST_DB_PORT || 5433,
      user: process.env.TEST_DB_USER || 'kdfamily_user',
      password: process.env.TEST_DB_PASSWORD || 'kdfamily_pass',
      database: process.env.TEST_DB_NAME || 'kdfamily_test'
    });
    
    // 清理测试数据
    await pool.query('TRUNCATE TABLE points_history, tasks, users, task_types RESTART IDENTITY CASCADE');
    
    // 插入测试数据
    await pool.query(`
      INSERT INTO task_types (code, name, description, default_points) VALUES
      ('TEST', '测试任务', '用于测试的任务类型', 10)
    `);
  });
  
  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });
  
  describe('用户模型测试', () => {
    test('应该能创建新用户', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: '测试用户'
      };
      
      const user = await User.create(userData);
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.fullName).toBe(userData.fullName);
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(userData.password);
    });
    
    test('应该能根据ID查找用户', async () => {
      const user = await User.findById(1);
      
      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
    });
    
    test('应该能根据用户名查找用户', async () => {
      const user = await User.findByUsername('testuser');
      
      expect(user).toBeDefined();
      expect(user.id).toBe(1);
    });
    
    test('应该能验证密码', async () => {
      const user = await User.findById(1);
      
      const isValid = await user.verifyPassword('password123');
      const isInvalid = await user.verifyPassword('wrongpassword');
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
    
    test('应该能更新用户信息', async () => {
      const user = await User.findById(1);
      
      const updatedUser = await user.update({
        fullName: '更新的用户名',
        bio: '这是一个测试用户'
      });
      
      expect(updatedUser.fullName).toBe('更新的用户名');
      expect(updatedUser.bio).toBe('这是一个测试用户');
    });
    
    test('应该能获取用户列表', async () => {
      // 创建更多测试用户
      await User.create({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
        fullName: '测试用户2'
      });
      
      const result = await User.findAll({ page: 1, limit: 10 });
      
      expect(result.users).toBeDefined();
      expect(result.users.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBeGreaterThan(0);
    });
  });
  
  describe('任务模型测试', () => {
    test('应该能创建新任务', async () => {
      const taskData = {
        title: '测试任务',
        description: '这是一个测试任务',
        taskTypeId: 1,
        points: 15,
        createdBy: 1
      };
      
      const task = await Task.create(taskData);
      
      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.points).toBe(taskData.points);
      expect(task.status).toBe('pending');
    });
    
    test('应该能根据ID查找任务', async () => {
      const task = await Task.findById(1);
      
      expect(task).toBeDefined();
      expect(task.title).toBe('测试任务');
      expect(task.taskType).toBeDefined();
      expect(task.createdByUser).toBeDefined();
    });
    
    test('应该能更新任务状态', async () => {
      const task = await Task.findById(1);
      
      const updatedTask = await task.updateStatus('claimed', 1);
      
      expect(updatedTask.status).toBe('claimed');
      expect(updatedTask.assignedTo).toBe(1);
    });
    
    test('应该能完成任务并获得积分', async () => {
      const task = await Task.findById(1);
      
      // 先设置为进行中
      await task.updateStatus('in_progress');
      
      // 然后完成任务
      await task.updateStatus('completed');
      
      // 最后批准任务
      const approvedTask = await task.updateStatus('approved', 2);
      
      expect(approvedTask.status).toBe('approved');
      expect(approvedTask.approvedBy).toBe(2);
      
      // 检查积分记录
      const pointsResult = await pool.query(
        'SELECT * FROM points_history WHERE task_id = $1',
        [task.id]
      );
      
      expect(pointsResult.rows.length).toBe(1);
      expect(pointsResult.rows[0].points_change).toBe(task.points);
    });
    
    test('应该能获取任务列表', async () => {
      const result = await Task.findAll({ page: 1, limit: 10 });
      
      expect(result.tasks).toBeDefined();
      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
    });
    
    test('应该能按状态过滤任务', async () => {
      const result = await Task.findAll({ status: 'approved' });
      
      expect(result.tasks).toBeDefined();
      result.tasks.forEach(task => {
        expect(task.status).toBe('approved');
      });
    });
    
    test('应该能搜索任务', async () => {
      const result = await Task.findAll({ search: '测试' });
      
      expect(result.tasks).toBeDefined();
      result.tasks.forEach(task => {
        expect(task.title.includes('测试') || task.description.includes('测试')).toBe(true);
      });
    });
  });
  
  describe('数据库约束测试', () => {
    test('应该防止重复的用户名', async () => {
      await expect(User.create({
        username: 'testuser',
        email: 'different@example.com',
        password: 'password123',
        fullName: '重复用户名'
      })).rejects.toThrow();
    });
    
    test('应该防止重复的邮箱', async () => {
      await expect(User.create({
        username: 'differentuser',
        email: 'test@example.com',
        password: 'password123',
        fullName: '重复邮箱'
      })).rejects.toThrow();
    });
    
    test('应该防止无效的外键引用', async () => {
      await expect(Task.create({
        title: '无效任务',
        description: '引用不存在的用户',
        taskTypeId: 1,
        createdBy: 999 // 不存在的用户ID
      })).rejects.toThrow();
    });
  });
  
  describe('性能测试', () => {
    test('用户查询性能', async () => {
      const startTime = Date.now();
      
      await User.findAll({ page: 1, limit: 100 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
    
    test('任务查询性能', async () => {
      const startTime = Date.now();
      
      await Task.findAll({ page: 1, limit: 100 });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });
    
    test('复杂查询性能', async () => {
      const startTime = Date.now();
      
      await User.getLeaderboard('all', 50);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000); // 应该在2秒内完成
    });
  });
  
  describe('事务测试', () => {
    test('应该能正确处理事务回滚', async () => {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // 插入一个用户
        const userResult = await client.query(`
          INSERT INTO users (username, email, password_hash, full_name)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, ['transactionuser', 'transaction@example.com', 'hash', '事务用户']);
        
        const userId = userResult.rows[0].id;
        
        // 故意触发错误（违反约束）
        await expect(client.query(`
          INSERT INTO users (username, email, password_hash, full_name)
          VALUES ($1, $2, $3, $4)
        `, ['transactionuser', 'transaction@example.com', 'hash', '重复用户'])).rejects.toThrow();
        
        await client.query('ROLLBACK');
        
        // 验证用户没有被插入
        const checkResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        expect(checkResult.rows.length).toBe(0);
        
      } finally {
        client.release();
      }
    });
  });
});
