const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');

// Import routes
const pointsRoutes = require('../server/routes/points');
const authRoutes = require('../server/routes/auth');
const tasksRoutes = require('../server/routes/tasks');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/points', pointsRoutes);

describe('积分系统测试', () => {
    let connection;
    let advisorToken, memberToken;
    let advisorId, memberId;
    
    beforeAll(async () => {
        // 手动设置环境变量
        process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
        process.env.JWT_EXPIRES_IN = '7d';
        
        // 创建测试数据库连接
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3307,
            user: process.env.DB_USER || 'kdfamily_user',
            password: process.env.DB_PASSWORD || 'kdfamily_pass',
            database: process.env.DB_NAME || 'kdfamily'
        });
    });

    afterAll(async () => {
        if (connection) {
            await connection.end();
        }
    });

    beforeEach(async () => {
        // 清理测试数据 - 按外键约束顺序删除
        await connection.execute('DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE username LIKE "%test%" OR email LIKE "%test%")');
        await connection.execute('DELETE FROM points_history WHERE reason LIKE "%Test%" OR reason LIKE "%test%" OR user_id IN (SELECT id FROM users WHERE username LIKE "%test%" OR email LIKE "%test%")');
        await connection.execute('DELETE FROM tasks WHERE title LIKE "%Test%" OR title LIKE "%test%" OR created_by IN (SELECT id FROM users WHERE username LIKE "%test%" OR email LIKE "%test%") OR assigned_to IN (SELECT id FROM users WHERE username LIKE "%test%" OR email LIKE "%test%")');
        await connection.execute('DELETE FROM users WHERE username LIKE "%test%" OR email LIKE "%test%"');
        
        // 创建测试用户
        const users = [
            { username: 'testadvisor', role: 'advisor' },
            { username: 'testmember', role: 'member' }
        ];

        const tokens = [];
        const userIds = [];

        for (const user of users) {
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    username: user.username,
                    password: 'password123',
                    email: `${user.username}@example.com`,
                    fullName: `Test ${user.role} User`,
                    role: user.role
                });

            if (registerResponse.status !== 201) {
                console.log(`User registration failed for ${user.username}:`, registerResponse.body);
                throw new Error(`User registration failed for ${user.username}: ${JSON.stringify(registerResponse.body)}`);
            }

            tokens.push(registerResponse.body.token);
            userIds.push(registerResponse.body.user.id);
        }

        [advisorToken, memberToken] = tokens;
        [advisorId, memberId] = userIds;
    });

    describe('积分记录管理测试', () => {
        test('获取用户积分历史', async () => {
            // 先添加一些积分记录
            await connection.execute(
                'INSERT INTO points_history (user_id, points, reason, created_by) VALUES (?, ?, ?, ?)',
                [memberId, 10, 'Test task completion', advisorId]
            );

            await connection.execute(
                'INSERT INTO points_history (user_id, points, reason, created_by) VALUES (?, ?, ?, ?)',
                [memberId, 15, 'Test bonus points', advisorId]
            );

            const response = await request(app)
                .get('/api/points/history')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);

            const pointRecord = response.body[0];
            expect(pointRecord).toHaveProperty('points');
            expect(pointRecord).toHaveProperty('reason');
            expect(pointRecord).toHaveProperty('created_at');
        });

        test('获取其他用户积分历史 - advisor权限', async () => {
            // advisor可以查看所有用户的积分历史
            const response = await request(app)
                .get(`/api/points/history/${memberId}`)
                .set('Authorization', `Bearer ${advisorToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        test('获取其他用户积分历史 - member权限应失败', async () => {
            // member不能查看其他用户的积分历史
            const response = await request(app)
                .get(`/api/points/history/${advisorId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        test('手动添加积分 - advisor权限', async () => {
            const pointData = {
                userId: memberId,
                points: 20,
                reason: 'Test manual points addition'
            };

            const response = await request(app)
                .post('/api/points/add')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send(pointData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Points added successfully');

            // 验证积分是否添加
            const historyResponse = await request(app)
                .get(`/api/points/history/${memberId}`)
                .set('Authorization', `Bearer ${advisorToken}`)
                .expect(200);

            const latestRecord = historyResponse.body[0];
            expect(latestRecord).toHaveProperty('points', 20);
            expect(latestRecord).toHaveProperty('reason', 'Test manual points addition');
        });

        test('手动扣除积分 - advisor权限', async () => {
            const pointData = {
                userId: memberId,
                points: -10,
                reason: 'Test points deduction'
            };

            const response = await request(app)
                .post('/api/points/add')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send(pointData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Points added successfully');

            // 验证积分是否扣除
            const historyResponse = await request(app)
                .get(`/api/points/history/${memberId}`)
                .set('Authorization', `Bearer ${advisorToken}`)
                .expect(200);

            const latestRecord = historyResponse.body[0];
            expect(latestRecord).toHaveProperty('points', -10);
        });

        test('member无法手动添加积分', async () => {
            const pointData = {
                userId: advisorId,
                points: 50,
                reason: 'Unauthorized points addition'
            };

            const response = await request(app)
                .post('/api/points/add')
                .set('Authorization', `Bearer ${memberToken}`)
                .send(pointData)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        test('任务完成自动添加积分', async () => {
            // 创建任务
            const createTaskResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Points Task',
                    description: 'Task that gives points',
                    taskType: 'PM',
                    points: 25,
                    assignedTo: memberId
                });

            const taskId = createTaskResponse.body.task.id;

            // 完成任务流程
            await request(app)
                .put(`/api/tasks/${taskId}/claim`)
                .set('Authorization', `Bearer ${memberToken}`);

            await request(app)
                .put(`/api/tasks/${taskId}/start`)
                .set('Authorization', `Bearer ${memberToken}`);

            await request(app)
                .put(`/api/tasks/${taskId}/complete`)
                .set('Authorization', `Bearer ${memberToken}`);

            await request(app)
                .put(`/api/tasks/${taskId}/approve`)
                .set('Authorization', `Bearer ${advisorToken}`);

            // 检查积分是否自动添加
            const response = await request(app)
                .get('/api/points/history')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            const taskPointRecord = response.body.find(record => 
                record.reason.includes('Test Points Task')
            );

            expect(taskPointRecord).toBeDefined();
            expect(taskPointRecord).toHaveProperty('points', 25);
        });
    });

    describe('排行榜功能测试', () => {
        beforeEach(async () => {
            // 创建多个测试用户并添加积分
            const users = [
                { username: 'testuser1', points: 100 },
                { username: 'testuser2', points: 150 },
                { username: 'testuser3', points: 75 }
            ];

            for (const user of users) {
                const registerResponse = await request(app)
                    .post('/api/auth/register')
                    .send({
                        username: user.username,
                        password: 'password123',
                        email: `${user.username}@example.com`,
                        fullName: `Test User ${user.username}`,
                        role: 'member'
                    });

                const userId = registerResponse.body.user.id;

                // 添加积分
                await connection.execute(
                    'INSERT INTO points_history (user_id, points, reason, created_by) VALUES (?, ?, ?, ?)',
                    [userId, user.points, `Test initial points for ${user.username}`, advisorId]
                );
            }
        });

        test('获取总排行榜', async () => {
            const response = await request(app)
                .get('/api/points/leaderboard')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            const topUser = response.body[0];
            expect(topUser).toHaveProperty('username');
            expect(topUser).toHaveProperty('fullName');
            expect(topUser).toHaveProperty('totalPoints');
            expect(topUser).toHaveProperty('rank');

            // 验证排序（积分从高到低）
            for (let i = 1; i < response.body.length; i++) {
                expect(response.body[i-1].totalPoints).toBeGreaterThanOrEqual(response.body[i].totalPoints);
            }
        });

        test('获取本周排行榜', async () => {
            const response = await request(app)
                .get('/api/points/leaderboard?period=week')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            
            const weeklyUser = response.body[0];
            expect(weeklyUser).toHaveProperty('weeklyPoints');
            expect(weeklyUser).toHaveProperty('rank');
        });

        test('获取本月排行榜', async () => {
            const response = await request(app)
                .get('/api/points/leaderboard?period=month')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            
            const monthlyUser = response.body[0];
            expect(monthlyUser).toHaveProperty('monthlyPoints');
            expect(monthlyUser).toHaveProperty('rank');
        });

        test('排行榜分页功能', async () => {
            const response = await request(app)
                .get('/api/points/leaderboard?page=1&limit=2')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeLessThanOrEqual(2);
        });

        test('获取用户排名', async () => {
            const response = await request(app)
                .get('/api/points/my-rank')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('rank');
            expect(response.body).toHaveProperty('totalPoints');
            expect(response.body).toHaveProperty('username');
        });
    });

    describe('积分统计功能测试', () => {
        beforeEach(async () => {
            // 添加测试积分数据
            const pointsData = [
                { points: 10, reason: 'Test task 1', days_ago: 0 },
                { points: 15, reason: 'Test task 2', days_ago: 1 },
                { points: 20, reason: 'Test task 3', days_ago: 7 },
                { points: 25, reason: 'Test task 4', days_ago: 30 }
            ];

            for (const data of pointsData) {
                const createdAt = new Date();
                createdAt.setDate(createdAt.getDate() - data.days_ago);
                
                await connection.execute(
                    'INSERT INTO points_history (user_id, points, reason, created_by, created_at) VALUES (?, ?, ?, ?, ?)',
                    [memberId, data.points, data.reason, advisorId, createdAt]
                );
            }
        });

        test('获取用户总积分', async () => {
            const response = await request(app)
                .get('/api/points/total')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('totalPoints');
            expect(response.body.totalPoints).toBeGreaterThan(0);
        });

        test('获取用户本周积分', async () => {
            const response = await request(app)
                .get('/api/points/weekly')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('weeklyPoints');
            expect(response.body).toHaveProperty('weekStart');
            expect(response.body).toHaveProperty('weekEnd');
        });

        test('获取用户本月积分', async () => {
            const response = await request(app)
                .get('/api/points/monthly')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('monthlyPoints');
            expect(response.body).toHaveProperty('monthStart');
            expect(response.body).toHaveProperty('monthEnd');
        });

        test('获取积分趋势数据', async () => {
            const response = await request(app)
                .get('/api/points/trend?days=30')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            
            if (response.body.length > 0) {
                const trendData = response.body[0];
                expect(trendData).toHaveProperty('date');
                expect(trendData).toHaveProperty('points');
            }
        });

        test('获取积分统计概览', async () => {
            const response = await request(app)
                .get('/api/points/stats')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('totalPoints');
            expect(response.body).toHaveProperty('weeklyPoints');
            expect(response.body).toHaveProperty('monthlyPoints');
            expect(response.body).toHaveProperty('averageDaily');
            expect(response.body).toHaveProperty('rank');
        });
    });

    describe('积分验证和安全测试', () => {
        test('积分数值验证', async () => {
            // 尝试添加无效的积分值
            const invalidData = [
                { points: 'invalid', reason: 'Invalid points type' },
                { points: null, reason: 'Null points' },
                { points: undefined, reason: 'Undefined points' }
            ];

            for (const data of invalidData) {
                const response = await request(app)
                    .post('/api/points/add')
                    .set('Authorization', `Bearer ${advisorToken}`)
                    .send({
                        userId: memberId,
                        ...data
                    })
                    .expect(400);

                expect(response.body).toHaveProperty('error');
            }
        });

        test('积分原因必填验证', async () => {
            const response = await request(app)
                .post('/api/points/add')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    userId: memberId,
                    points: 10
                    // 缺少reason
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        test('防止SQL注入攻击', async () => {
            const maliciousData = {
                userId: memberId,
                points: 10,
                reason: "'; DROP TABLE points_history; --"
            };

            const response = await request(app)
                .post('/api/points/add')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send(maliciousData)
                .expect(201);

            // 验证表仍然存在且数据正常
            const historyResponse = await request(app)
                .get('/api/points/history')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(Array.isArray(historyResponse.body)).toBe(true);
        });

        test('积分上限和下限验证', async () => {
            // 测试极大值
            const maxPointsData = {
                userId: memberId,
                points: 999999,
                reason: 'Test max points'
            };

            await request(app)
                .post('/api/points/add')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send(maxPointsData)
                .expect(201);

            // 测试极小值（负分）
            const minPointsData = {
                userId: memberId,
                points: -999999,
                reason: 'Test min points'
            };

            await request(app)
                .post('/api/points/add')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send(minPointsData)
                .expect(201);
        });
    });

    describe('积分系统性能测试', () => {
        test('批量积分操作性能', async () => {
            const startTime = Date.now();
            
            // 批量添加积分记录
            const promises = [];
            for (let i = 0; i < 100; i++) {
                promises.push(
                    request(app)
                        .post('/api/points/add')
                        .set('Authorization', `Bearer ${advisorToken}`)
                        .send({
                            userId: memberId,
                            points: Math.floor(Math.random() * 20) + 1,
                            reason: `Test batch points ${i}`
                        })
                );
            }

            await Promise.all(promises);
            
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 批量操作应在合理时间内完成（例如10秒）
            expect(duration).toBeLessThan(10000);
        });

        test('大量数据查询性能', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/points/leaderboard?limit=1000')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 查询应在合理时间内完成（例如2秒）
            expect(duration).toBeLessThan(2000);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});