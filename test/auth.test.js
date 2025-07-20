const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');

// Create test app
let app;

describe('认证系统测试', () => {
    let connection;
    
    beforeAll(async () => {
        // 手动设置环境变量
        process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
        process.env.JWT_EXPIRES_IN = '7d';
        
        // 确保环境变量已设置
        console.log('JWT_SECRET in test:', process.env.JWT_SECRET);
        
        // 等待全局数据库初始化完成后再导入路由
        const authRoutes = require('../server/routes/auth');
        
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);
        
        // 添加错误处理中间件
        app.use((error, req, res, next) => {
            console.error('Test app error:', error);
            res.status(500).json({ error: error.message, stack: error.stack });
        });
        
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
        await connection.execute('DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE username LIKE "test%")');
        await connection.execute('DELETE FROM points_history WHERE user_id IN (SELECT id FROM users WHERE username LIKE "test%")');
        await connection.execute('DELETE FROM tasks WHERE created_by IN (SELECT id FROM users WHERE username LIKE "test%") OR assigned_to IN (SELECT id FROM users WHERE username LIKE "test%")');
        await connection.execute('DELETE FROM users WHERE username LIKE "test%"');
    });

    describe('用户注册测试', () => {
        test('正常注册流程', async () => {
            const userData = {
                username: 'testuser',
                password: 'password123',
                email: 'test@example.com',
                fullName: 'Test User',
                role: 'member'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('username', 'testuser');
            expect(response.body.user).toHaveProperty('role', 'member');
        });

        test('重复用户名注册应失败', async () => {
            const userData = {
                username: 'testuser',
                password: 'password123',
                email: 'test@example.com',
                fullName: 'Test User',
                role: 'member'
            };

            // 第一次注册
            await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(201);

            // 第二次注册相同用户名
            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        test('缺少必填字段应失败', async () => {
            const userData = {
                username: 'testuser',
                password: 'password123'
                // 缺少email和fullName
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        test('无效邮箱格式应失败', async () => {
            const userData = {
                username: 'testuser',
                password: 'password123',
                email: 'invalid-email',
                fullName: 'Test User',
                role: 'member'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(userData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('用户登录测试', () => {
        beforeEach(async () => {
            // 创建测试用户
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testlogin',
                    password: 'password123',
                    email: 'testlogin@example.com',
                    fullName: 'Test Login User',
                    role: 'member'
                });
        });

        test('正常登录流程', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testlogin',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('username', 'testlogin');
        });

        test('错误密码登录应失败', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testlogin',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        test('不存在用户登录应失败', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'password123'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        test('缺少用户名或密码应失败', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testlogin'
                    // 缺少密码
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('JWT Token验证测试', () => {
        let userToken;

        beforeEach(async () => {
            // 注册并登录获取token
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testtoken',
                    password: 'password123',
                    email: 'testtoken@example.com',
                    fullName: 'Test Token User',
                    role: 'member'
                });

            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testtoken',
                    password: 'password123'
                });

            userToken = loginResponse.body.token;
        });

        test('有效Token应通过验证', async () => {
            // 导入认证中间件
            const { authenticateToken } = require('../server/middleware/auth');
            
            // 创建需要认证的测试路由
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/protected', authenticateToken, (req, res) => {
                res.json({ message: 'Access granted', user: req.user });
            });

            const response = await request(testApp)
                .get('/protected')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Access granted');
            expect(response.body.user).toHaveProperty('username', 'testtoken');
        });

        test('无效Token应被拒绝', async () => {
            const { authenticateToken } = require('../server/middleware/auth');
            
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/protected', authenticateToken, (req, res) => {
                res.json({ message: 'Access granted' });
            });

            const response = await request(testApp)
                .get('/protected')
                .set('Authorization', 'Bearer invalid_token')
                .expect(403);

            expect(response.body).toHaveProperty('error', 'Invalid or expired token');
        });

        test('缺少Token应被拒绝', async () => {
            const { authenticateToken } = require('../server/middleware/auth');
            
            const testApp = express();
            testApp.use(express.json());
            testApp.get('/protected', authenticateToken, (req, res) => {
                res.json({ message: 'Access granted' });
            });

            const response = await request(testApp)
                .get('/protected')
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Access token required');
        });
    });

    describe('角色权限测试', () => {
        let advisorToken, parentToken, memberToken;

        beforeEach(async () => {
            // 清理之前的测试数据
            await connection.execute('DELETE FROM users WHERE username LIKE "%user"');
            
            // 创建不同角色的用户
            const users = [
                { username: 'advisoruser', role: 'advisor' },
                { username: 'parentuser', role: 'parent' },
                { username: 'memberuser', role: 'member' }
            ];

            const tokens = [];
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
                    console.log('Registration failed for', user.username, ':', registerResponse.body);
                }
                
                expect(registerResponse.status).toBe(201);

                expect(registerResponse.body).toHaveProperty('token');
                tokens.push(registerResponse.body.token);
            }

            [advisorToken, parentToken, memberToken] = tokens;
        });

        test('advisor角色应有最高权限', async () => {
            // 这里可以添加需要advisor权限的API测试
            expect(advisorToken).toBeDefined();
        });

        test('parent角色应有中等权限', async () => {
            // 这里可以添加需要parent权限的API测试
            expect(parentToken).toBeDefined();
        });

        test('member角色应有基础权限', async () => {
            // 这里可以添加member权限的API测试
            expect(memberToken).toBeDefined();
        });
    });
});