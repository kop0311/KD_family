const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');

// Import all routes
const authRoutes = require('../server/routes/auth');
const usersRoutes = require('../server/routes/users');
const tasksRoutes = require('../server/routes/tasks');
const pointsRoutes = require('../server/routes/points');
const adminRoutes = require('../server/routes/admin');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/admin', adminRoutes);

describe('系统集成测试', () => {
    let connection;
    let advisorToken, parentToken, memberToken;
    let advisorId, parentId, memberId;
    
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
        await connection.execute('DELETE FROM tasks WHERE title LIKE "%Test%" OR title LIKE "%test%"');
        await connection.execute('DELETE FROM users WHERE username LIKE "%test%" OR email LIKE "%test%"');
        
        // 创建不同角色的测试用户
        const users = [
            { username: 'testadvisor', role: 'advisor' },
            { username: 'testparent', role: 'parent' },
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

        [advisorToken, parentToken, memberToken] = tokens;
        [advisorId, parentId, memberId] = userIds;
    });

    describe('完整任务流程测试', () => {
        test('完整的任务生命周期', async () => {
            // 1. Advisor创建任务
            const createTaskResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Integration Task',
                    description: 'Full lifecycle integration test',
                    taskType: 'PM',
                    points: 30,
                    assignedTo: memberId
                })
                .expect(201);

            const taskId = createTaskResponse.body.task.id;
            expect(createTaskResponse.body.task.status).toBe('pending');

            // 2. Member认领任务
            const claimResponse = await request(app)
                .put(`/api/tasks/${taskId}/claim`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(claimResponse.body.message).toBe('Task claimed successfully');

            // 验证任务状态
            let taskResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(taskResponse.body.status).toBe('claimed');
            expect(taskResponse.body.claimedBy).toBe(memberId);

            // 3. Member开始任务
            await request(app)
                .put(`/api/tasks/${taskId}/start`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            taskResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(taskResponse.body.status).toBe('in_progress');

            // 4. Member完成任务
            await request(app)
                .put(`/api/tasks/${taskId}/complete`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            taskResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(taskResponse.body.status).toBe('completed');

            // 5. Advisor审批任务
            await request(app)
                .put(`/api/tasks/${taskId}/approve`)
                .set('Authorization', `Bearer ${advisorToken}`)
                .expect(200);

            taskResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(taskResponse.body.status).toBe('approved');

            // 6. 验证积分自动添加
            const pointsResponse = await request(app)
                .get('/api/points/history')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            const taskPointRecord = pointsResponse.body.find(record => 
                record.reason.includes('Test Integration Task')
            );

            expect(taskPointRecord).toBeDefined();
            expect(taskPointRecord.points).toBe(30);

            // 7. 验证排行榜更新
            const leaderboardResponse = await request(app)
                .get('/api/points/leaderboard')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            const memberRank = leaderboardResponse.body.find(user => user.id === memberId);
            expect(memberRank).toBeDefined();
            expect(memberRank.totalPoints).toBeGreaterThanOrEqual(30);
        });

        test('任务拒绝流程', async () => {
            // 1. 创建任务
            const createTaskResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Reject Task',
                    description: 'Task to be rejected',
                    taskType: 'FTL',
                    points: 20,
                    assignedTo: memberId
                });

            const taskId = createTaskResponse.body.task.id;

            // 2. 完成任务流程到completed状态
            await request(app)
                .put(`/api/tasks/${taskId}/claim`)
                .set('Authorization', `Bearer ${memberToken}`);

            await request(app)
                .put(`/api/tasks/${taskId}/start`)
                .set('Authorization', `Bearer ${memberToken}`);

            await request(app)
                .put(`/api/tasks/${taskId}/complete`)
                .set('Authorization', `Bearer ${memberToken}`);

            // 3. Advisor拒绝任务
            const rejectResponse = await request(app)
                .put(`/api/tasks/${taskId}/reject`)
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    reason: 'Task quality not meeting standards'
                })
                .expect(200);

            expect(rejectResponse.body.message).toBe('Task rejected successfully');

            // 4. 验证任务状态
            const taskResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(taskResponse.body.status).toBe('rejected');

            // 5. 验证没有积分添加
            const pointsResponse = await request(app)
                .get('/api/points/history')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            const taskPointRecord = pointsResponse.body.find(record => 
                record.reason.includes('Test Reject Task')
            );

            expect(taskPointRecord).toBeUndefined();
        });
    });

    describe('用户角色权限集成测试', () => {
        test('Advisor完整权限测试', async () => {
            // 创建任务
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Advisor Test Task',
                    description: 'Testing advisor permissions',
                    taskType: 'PM',
                    points: 15
                })
                .expect(201);

            // 添加积分
            await request(app)
                .post('/api/points/add')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    userId: memberId,
                    points: 50,
                    reason: 'Advisor manual points'
                })
                .expect(201);

            // 查看管理面板
            await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${advisorToken}`)
                .expect(200);

            // 管理用户
            await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${advisorToken}`)
                .expect(200);
        });

        test('Parent部分权限测试', async () => {
            // 可以创建任务
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${parentToken}`)
                .send({
                    title: 'Parent Test Task',
                    description: 'Testing parent permissions',
                    taskType: 'FTL',
                    points: 12
                })
                .expect(201);

            // 不能添加积分
            await request(app)
                .post('/api/points/add')
                .set('Authorization', `Bearer ${parentToken}`)
                .send({
                    userId: memberId,
                    points: 25,
                    reason: 'Parent attempt'
                })
                .expect(403);

            // 不能访问管理面板
            await request(app)
                .get('/api/admin/dashboard')
                .set('Authorization', `Bearer ${parentToken}`)
                .expect(403);
        });

        test('Member基础权限测试', async () => {
            // 不能创建任务
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${memberToken}`)
                .send({
                    title: 'Member Test Task',
                    description: 'Member attempt to create task',
                    taskType: 'PA',
                    points: 8
                })
                .expect(403);

            // 可以查看任务列表
            await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            // 可以查看自己的积分
            await request(app)
                .get('/api/points/history')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            // 可以查看排行榜
            await request(app)
                .get('/api/points/leaderboard')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);
        });
    });

    describe('数据一致性测试', () => {
        test('任务和积分数据一致性', async () => {
            // 创建多个任务
            const tasks = [];
            for (let i = 0; i < 3; i++) {
                const createResponse = await request(app)
                    .post('/api/tasks')
                    .set('Authorization', `Bearer ${advisorToken}`)
                    .send({
                        title: `Test Consistency Task ${i}`,
                        description: `Consistency test task ${i}`,
                        taskType: 'PM',
                        points: (i + 1) * 10,
                        assignedTo: memberId
                    });

                tasks.push(createResponse.body.task);
            }

            // 完成所有任务
            for (const task of tasks) {
                await request(app)
                    .put(`/api/tasks/${task.id}/claim`)
                    .set('Authorization', `Bearer ${memberToken}`);

                await request(app)
                    .put(`/api/tasks/${task.id}/start`)
                    .set('Authorization', `Bearer ${memberToken}`);

                await request(app)
                    .put(`/api/tasks/${task.id}/complete`)
                    .set('Authorization', `Bearer ${memberToken}`);

                await request(app)
                    .put(`/api/tasks/${task.id}/approve`)
                    .set('Authorization', `Bearer ${advisorToken}`);
            }

            // 验证积分总和
            const pointsResponse = await request(app)
                .get('/api/points/history')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            const taskPointRecords = pointsResponse.body.filter(record => 
                record.reason.includes('Test Consistency Task')
            );

            expect(taskPointRecords.length).toBe(3);

            const totalTaskPoints = taskPointRecords.reduce((sum, record) => sum + record.points, 0);
            const expectedPoints = tasks.reduce((sum, task) => sum + task.points, 0);

            expect(totalTaskPoints).toBe(expectedPoints);

            // 验证用户总积分
            const totalResponse = await request(app)
                .get('/api/points/total')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(totalResponse.body.totalPoints).toBeGreaterThanOrEqual(expectedPoints);
        });

        test('并发操作数据一致性', async () => {
            // 创建任务
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Concurrent Task',
                    description: 'Testing concurrent operations',
                    taskType: 'PM',
                    points: 100
                });

            const taskId = createResponse.body.task.id;

            // 多个用户同时尝试认领任务
            const claimPromises = [
                request(app)
                    .put(`/api/tasks/${taskId}/claim`)
                    .set('Authorization', `Bearer ${memberToken}`),
                request(app)
                    .put(`/api/tasks/${taskId}/claim`)
                    .set('Authorization', `Bearer ${parentToken}`)
            ];

            const claimResults = await Promise.allSettled(claimPromises);

            // 只有一个应该成功
            const successfulClaims = claimResults.filter(result => 
                result.status === 'fulfilled' && result.value.status === 200
            );

            expect(successfulClaims.length).toBe(1);

            // 验证任务状态
            const taskResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(taskResponse.body.status).toBe('claimed');
            expect(taskResponse.body.claimedBy).toBeDefined();
        });
    });

    describe('系统性能集成测试', () => {
        test('大量数据操作性能', async () => {
            const startTime = Date.now();

            // 创建大量任务
            const taskPromises = [];
            for (let i = 0; i < 50; i++) {
                taskPromises.push(
                    request(app)
                        .post('/api/tasks')
                        .set('Authorization', `Bearer ${advisorToken}`)
                        .send({
                            title: `Performance Test Task ${i}`,
                            description: `Performance testing task ${i}`,
                            taskType: 'PM',
                            points: Math.floor(Math.random() * 50) + 1
                        })
                );
            }

            await Promise.all(taskPromises);

            // 查询大量数据
            await request(app)
                .get('/api/tasks?limit=100')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            await request(app)
                .get('/api/points/leaderboard?limit=100')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 操作应在合理时间内完成
            expect(duration).toBeLessThan(30000); // 30秒
        });

        test('系统响应时间测试', async () => {
            const endpoints = [
                { method: 'GET', path: '/api/tasks', token: memberToken },
                { method: 'GET', path: '/api/points/leaderboard', token: memberToken },
                { method: 'GET', path: '/api/points/history', token: memberToken },
                { method: 'GET', path: '/api/users/profile', token: memberToken }
            ];

            for (const endpoint of endpoints) {
                const startTime = Date.now();

                if (endpoint.method === 'GET') {
                    await request(app)
                        .get(endpoint.path)
                        .set('Authorization', `Bearer ${endpoint.token}`)
                        .expect(200);
                }

                const endTime = Date.now();
                const responseTime = endTime - startTime;

                // 每个API调用应在2秒内响应
                expect(responseTime).toBeLessThan(2000);
            }
        });
    });

    describe('错误处理集成测试', () => {
        test('级联错误处理', async () => {
            // 创建任务但指定不存在的用户
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Invalid User Task',
                    description: 'Task with invalid user',
                    taskType: 'PM',
                    points: 10,
                    assignedTo: 99999
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        test('网络错误恢复测试', async () => {
            // 模拟网络超时等场景
            // 这里可以添加具体的网络错误模拟测试
            const response = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${memberToken}`)
                .timeout(100) // 设置很短的超时时间
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        test('数据库连接错误处理', async () => {
            // 这里可以添加数据库连接错误的模拟测试
            // 由于测试环境限制，这里主要测试基本的错误响应格式
            const response = await request(app)
                .get('/api/tasks/999999')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('安全集成测试', () => {
        test('跨用户数据访问防护', async () => {
            // 用户A尝试访问用户B的数据
            const response = await request(app)
                .get(`/api/points/history/${advisorId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        test('Token过期处理', async () => {
            // 使用过期或无效token
            const response = await request(app)
                .get('/api/tasks')
                .set('Authorization', 'Bearer invalid_token')
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        test('SQL注入防护测试', async () => {
            const maliciousInput = "'; DROP TABLE users; --";
            
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: maliciousInput,
                    description: 'Normal description',
                    taskType: 'PM',
                    points: 10
                })
                .expect(201);

            // 验证恶意输入被安全处理
            expect(response.body.task.title).toBe(maliciousInput);

            // 验证数据库表仍然存在
            await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);
        });
    });
});