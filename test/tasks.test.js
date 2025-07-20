const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');

// Import routes
const tasksRoutes = require('../server/routes/tasks');
const authRoutes = require('../server/routes/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);

describe('任务管理系统测试', () => {
    let connection;
    let advisorToken, parentToken, memberToken;
    let advisorId, parentId, memberId;
    let testTaskId;
    
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
        await connection.execute('DELETE FROM points_history WHERE user_id IN (SELECT id FROM users WHERE username LIKE "%test%" OR email LIKE "%test%")');
        await connection.execute('DELETE FROM tasks WHERE title LIKE "%Test%" OR title LIKE "%test%" OR created_by IN (SELECT id FROM users WHERE username LIKE "%test%" OR email LIKE "%test%") OR assigned_to IN (SELECT id FROM users WHERE username LIKE "%test%" OR email LIKE "%test%")');
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

    describe('任务CRUD操作测试', () => {
        test('创建任务 - advisor权限', async () => {
            const taskData = {
                title: 'Test Task',
                description: 'This is a test task',
                taskType: 'PM',
                points: 10,
                assignedTo: memberId
            };

            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Task created successfully');
            expect(response.body.task).toHaveProperty('title', 'Test Task');
            expect(response.body.task).toHaveProperty('status', 'pending');
            expect(response.body.task).toHaveProperty('points', 10);
            
            testTaskId = response.body.task.id;
        });

        test('创建任务 - parent权限', async () => {
            const taskData = {
                title: 'Test Parent Task',
                description: 'Task created by parent',
                taskType: 'FTL',
                points: 15,
                assignedTo: memberId
            };

            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${parentToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Task created successfully');
        });

        test('创建任务 - member权限应失败', async () => {
            const taskData = {
                title: 'Test Member Task',
                description: 'Task created by member',
                taskType: 'PA',
                points: 5
            };

            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${memberToken}`)
                .send(taskData)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        test('获取任务列表', async () => {
            // 先创建一些任务
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Task 1',
                    description: 'First test task',
                    taskType: 'PM',
                    points: 10
                });

            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Task 2',
                    description: 'Second test task',
                    taskType: 'FTL',
                    points: 15
                });

            const response = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
            
            const task = response.body[0];
            expect(task).toHaveProperty('id');
            expect(task).toHaveProperty('title');
            expect(task).toHaveProperty('status');
            expect(task).toHaveProperty('points');
        });

        test('获取单个任务详情', async () => {
            // 先创建任务
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Single Task',
                    description: 'Task for detail test',
                    taskType: 'PA',
                    points: 20
                });

            const taskId = createResponse.body.task.id;

            const response = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('title', 'Test Single Task');
            expect(response.body).toHaveProperty('description', 'Task for detail test');
            expect(response.body).toHaveProperty('points', 20);
        });

        test('更新任务', async () => {
            // 先创建任务
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Update Task',
                    description: 'Task to be updated',
                    taskType: 'PM',
                    points: 10
                });

            const taskId = createResponse.body.task.id;
            const updateData = {
                title: 'Updated Test Task',
                description: 'Updated description',
                points: 15
            };

            const response = await request(app)
                .put(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${advisorToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Task updated successfully');

            // 验证更新
            const getResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(getResponse.body).toHaveProperty('title', 'Updated Test Task');
            expect(getResponse.body).toHaveProperty('points', 15);
        });

        test('删除任务', async () => {
            // 先创建任务
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Delete Task',
                    description: 'Task to be deleted',
                    taskType: 'UBI',
                    points: 5
                });

            const taskId = createResponse.body.task.id;

            const response = await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${advisorToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Task deleted successfully');

            // 验证删除
            await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(404);
        });
    });

    describe('任务状态流转测试', () => {
        let taskId;

        beforeEach(async () => {
            // 创建测试任务
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Status Task',
                    description: 'Task for status testing',
                    taskType: 'PM',
                    points: 10
                });

            taskId = createResponse.body.task.id;
        });

        test('pending → claimed 状态转换', async () => {
            const response = await request(app)
                .put(`/api/tasks/${taskId}/claim`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Task claimed successfully');

            // 验证状态更新
            const getResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(getResponse.body).toHaveProperty('status', 'claimed');
            expect(getResponse.body).toHaveProperty('claimedBy', memberId);
        });

        test('claimed → in_progress 状态转换', async () => {
            // 先认领任务
            await request(app)
                .put(`/api/tasks/${taskId}/claim`)
                .set('Authorization', `Bearer ${memberToken}`);

            const response = await request(app)
                .put(`/api/tasks/${taskId}/start`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Task started successfully');

            // 验证状态更新
            const getResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(getResponse.body).toHaveProperty('status', 'in_progress');
        });

        test('in_progress → completed 状态转换', async () => {
            // 先完成前置状态转换
            await request(app)
                .put(`/api/tasks/${taskId}/claim`)
                .set('Authorization', `Bearer ${memberToken}`);

            await request(app)
                .put(`/api/tasks/${taskId}/start`)
                .set('Authorization', `Bearer ${memberToken}`);

            const response = await request(app)
                .put(`/api/tasks/${taskId}/complete`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Task completed successfully');

            // 验证状态更新
            const getResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(getResponse.body).toHaveProperty('status', 'completed');
        });

        test('completed → approved 状态转换', async () => {
            // 先完成所有前置状态转换
            await request(app)
                .put(`/api/tasks/${taskId}/claim`)
                .set('Authorization', `Bearer ${memberToken}`);

            await request(app)
                .put(`/api/tasks/${taskId}/start`)
                .set('Authorization', `Bearer ${memberToken}`);

            await request(app)
                .put(`/api/tasks/${taskId}/complete`)
                .set('Authorization', `Bearer ${memberToken}`);

            const response = await request(app)
                .put(`/api/tasks/${taskId}/approve`)
                .set('Authorization', `Bearer ${advisorToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Task approved successfully');

            // 验证状态更新
            const getResponse = await request(app)
                .get(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(getResponse.body).toHaveProperty('status', 'approved');
        });

        test('非法状态转换应失败', async () => {
            // 尝试直接从pending跳到completed
            const response = await request(app)
                .put(`/api/tasks/${taskId}/complete`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('任务分配和认领测试', () => {
        test('分配任务给特定用户', async () => {
            const taskData = {
                title: 'Test Assigned Task',
                description: 'Task assigned to specific user',
                taskType: 'FTL',
                points: 20,
                assignedTo: memberId
            };

            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send(taskData)
                .expect(201);

            expect(response.body.task).toHaveProperty('assignedTo', memberId);
        });

        test('用户认领未分配的任务', async () => {
            // 创建未分配的任务
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Unclaimed Task',
                    description: 'Task available for claiming',
                    taskType: 'PA',
                    points: 15
                });

            const taskId = createResponse.body.task.id;

            const response = await request(app)
                .put(`/api/tasks/${taskId}/claim`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Task claimed successfully');
        });

        test('用户无法认领已分配给他人的任务', async () => {
            // 创建分配给parent的任务
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Test Assigned to Parent Task',
                    description: 'Task assigned to parent',
                    taskType: 'PM',
                    points: 10,
                    assignedTo: parentId
                });

            const taskId = createResponse.body.task.id;

            // member尝试认领
            const response = await request(app)
                .put(`/api/tasks/${taskId}/claim`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        test('获取分配给我的任务', async () => {
            // 创建分配给member的任务
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'My Task 1',
                    description: 'Task assigned to me',
                    taskType: 'PM',
                    points: 10,
                    assignedTo: memberId
                });

            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'My Task 2',
                    description: 'Another task assigned to me',
                    taskType: 'FTL',
                    points: 15,
                    assignedTo: memberId
                });

            const response = await request(app)
                .get('/api/tasks/my-tasks')
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThanOrEqual(2);
            
            // 所有返回的任务都应该分配给当前用户
            response.body.forEach(task => {
                expect(task.assignedTo).toBe(memberId);
            });
        });
    });

    describe('任务权限控制测试', () => {
        test('只有advisor和parent可以创建任务', async () => {
            const taskData = {
                title: 'Permission Test Task',
                description: 'Testing permission',
                taskType: 'PM',
                points: 10
            };

            // member尝试创建任务
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${memberToken}`)
                .send(taskData)
                .expect(403);

            // advisor创建任务
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send(taskData)
                .expect(201);

            // parent创建任务
            await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${parentToken}`)
                .send(taskData)
                .expect(201);
        });

        test('只有任务创建者或advisor可以删除任务', async () => {
            // parent创建任务
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${parentToken}`)
                .send({
                    title: 'Delete Permission Test',
                    description: 'Testing delete permission',
                    taskType: 'PA',
                    points: 5
                });

            const taskId = createResponse.body.task.id;

            // member尝试删除
            await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .expect(403);

            // parent（创建者）删除
            await request(app)
                .delete(`/api/tasks/${taskId}`)
                .set('Authorization', `Bearer ${parentToken}`)
                .expect(200);
        });

        test('只有advisor可以审批任务', async () => {
            // 创建并完成任务
            const createResponse = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Approval Test Task',
                    description: 'Testing approval permission',
                    taskType: 'PM',
                    points: 10
                });

            const taskId = createResponse.body.task.id;

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

            // parent尝试审批
            await request(app)
                .put(`/api/tasks/${taskId}/approve`)
                .set('Authorization', `Bearer ${parentToken}`)
                .expect(403);

            // advisor审批
            await request(app)
                .put(`/api/tasks/${taskId}/approve`)
                .set('Authorization', `Bearer ${advisorToken}`)
                .expect(200);
        });
    });

    describe('任务类型测试', () => {
        test('支持所有任务类型', async () => {
            const taskTypes = ['PM', 'FTL', 'PA', 'UBI'];

            for (const taskType of taskTypes) {
                const response = await request(app)
                    .post('/api/tasks')
                    .set('Authorization', `Bearer ${advisorToken}`)
                    .send({
                        title: `Test ${taskType} Task`,
                        description: `Testing ${taskType} task type`,
                        taskType: taskType,
                        points: 10
                    })
                    .expect(201);

                expect(response.body.task).toHaveProperty('taskType', taskType);
            }
        });

        test('无效任务类型应失败', async () => {
            const response = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${advisorToken}`)
                .send({
                    title: 'Invalid Type Task',
                    description: 'Testing invalid task type',
                    taskType: 'INVALID',
                    points: 10
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });
});