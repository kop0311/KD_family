const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Import routes
const usersRoutes = require('../server/routes/users');
const authRoutes = require('../server/routes/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

describe('用户管理系统测试', () => {
    let connection;
    let userToken;
    let testUserId;
    
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
        await connection.execute('DELETE FROM tasks WHERE created_by IN (SELECT id FROM users WHERE username LIKE "%test%" OR email LIKE "%test%") OR assigned_to IN (SELECT id FROM users WHERE username LIKE "%test%" OR email LIKE "%test%")');
        await connection.execute('DELETE FROM users WHERE username LIKE "%test%" OR email LIKE "%test%"');
        
        // 创建测试用户并获取token
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                password: 'password123',
                email: 'test@example.com',
                fullName: 'Test User',
                role: 'member'
            });

        if (registerResponse.status !== 201) {
            console.log('User registration failed:', registerResponse.body);
            throw new Error(`User registration failed: ${JSON.stringify(registerResponse.body)}`);
        }

        userToken = registerResponse.body.token;
        testUserId = registerResponse.body.user.id;
    });

    describe('用户资料管理测试', () => {
        test('获取用户信息', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.user).toHaveProperty('username', 'testuser');
            expect(response.body.user).toHaveProperty('email', 'test@example.com');
            expect(response.body.user).toHaveProperty('full_name', 'Test User');
            expect(response.body.user).toHaveProperty('role', 'member');
        });

        test('更新用户资料', async () => {
            const updateData = {
                fullName: 'Updated Test User',
                email: 'updated@example.com'
            };

            const response = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Profile updated successfully');

            // 验证更新是否成功
            const profileResponse = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(profileResponse.body.user).toHaveProperty('full_name', 'Updated Test User');
            expect(profileResponse.body.user).toHaveProperty('email', 'updated@example.com');
        });

        test('无效邮箱格式更新应失败', async () => {
            const updateData = {
                email: 'invalid-email-format'
            };

            const response = await request(app)
                .put('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        test('未认证用户无法访问资料', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Access token required');
        });
    });

    describe('用户列表查询测试', () => {
        beforeEach(async () => {
            // 创建多个测试用户
            const users = [
                { username: 'testuser1', role: 'member' },
                { username: 'testuser2', role: 'parent' },
                { username: 'testuser3', role: 'advisor' }
            ];

            for (const user of users) {
                await request(app)
                    .post('/api/auth/register')
                    .send({
                        username: user.username,
                        password: 'password123',
                        email: `${user.username}@example.com`,
                        fullName: `Test ${user.username}`,
                        role: user.role
                    });
            }
        });

        test('获取用户列表', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            
            // 检查用户数据结构
            const user = response.body[0];
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('username');
            expect(user).toHaveProperty('full_name');
            expect(user).toHaveProperty('role');
            expect(user).not.toHaveProperty('password'); // 密码不应返回
        });

        test('按角色筛选用户', async () => {
            const response = await request(app)
                .get('/api/users?role=parent')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // 所有返回的用户都应该是parent角色
            response.body.forEach(user => {
                expect(user.role).toBe('parent');
            });
        });
    });

    describe('头像功能测试', () => {
        test('更新头像URL', async () => {
            const avatarData = {
                avatarUrl: 'https://api.dicebear.com/6.x/avataaars/svg?seed=testuser'
            };

            const response = await request(app)
                .post('/api/users/avatar')
                .set('Authorization', `Bearer ${userToken}`)
                .send(avatarData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Avatar updated successfully');
            expect(response.body).toHaveProperty('avatarUrl', avatarData.avatarUrl);

            // 验证头像是否更新
            const profileResponse = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(profileResponse.body.user).toHaveProperty('avatar_url', avatarData.avatarUrl);
        });

        test('无效URL格式应失败', async () => {
            const avatarData = {
                avatarUrl: 'invalid-url'
            };

            const response = await request(app)
                .post('/api/users/avatar')
                .set('Authorization', `Bearer ${userToken}`)
                .send(avatarData)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        test('头像文件上传测试', async () => {
            // 创建测试图片文件
            const testImagePath = path.join(__dirname, 'test-avatar.png');
            const testImageBuffer = Buffer.from('fake image data');
            
            // 如果测试图片不存在，创建一个
            if (!fs.existsSync(testImagePath)) {
                fs.writeFileSync(testImagePath, testImageBuffer);
            }

            const response = await request(app)
                .post('/api/users/avatar')
                .set('Authorization', `Bearer ${userToken}`)
                .attach('avatar', testImagePath)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Avatar updated successfully');
            expect(response.body).toHaveProperty('avatarUrl');
            expect(response.body.avatarUrl).toContain('/uploads/avatars/');

            // 清理测试文件
            if (fs.existsSync(testImagePath)) {
                fs.unlinkSync(testImagePath);
            }
        });

        test('非图片文件上传应失败', async () => {
            const testFilePath = path.join(__dirname, 'test-file.txt');
            fs.writeFileSync(testFilePath, 'This is not an image');

            const response = await request(app)
                .post('/api/users/avatar')
                .set('Authorization', `Bearer ${userToken}`)
                .attach('avatar', testFilePath)
                .expect(400);

            expect(response.body).toHaveProperty('error');

            // 清理测试文件
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        });
    });

    describe('用户权限和安全测试', () => {
        let otherUserToken;

        beforeEach(async () => {
            // 创建另一个用户
            const otherUserResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'otheruser',
                    password: 'password123',
                    email: 'other@example.com',
                    fullName: 'Other User',
                    role: 'member'
                });

            otherUserToken = otherUserResponse.body.token;
        });

        test('用户只能访问自己的资料', async () => {
            // 用户A尝试访问用户B的资料
            const response = await request(app)
                .get(`/api/users/profile/${testUserId + 1}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        test('用户只能更新自己的资料', async () => {
            const updateData = {
                fullName: 'Malicious Update'
            };

            // 用户A尝试更新用户B的资料
            const response = await request(app)
                .put(`/api/users/profile/${testUserId + 1}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(403);

            expect(response.body).toHaveProperty('error');
        });

        test('密码不应在API响应中返回', async () => {
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).not.toHaveProperty('password');
            expect(response.body).not.toHaveProperty('passwordHash');
        });
    });

    describe('DiceBear API集成测试', () => {
        test('生成随机头像URL', async () => {
            const response = await request(app)
                .get('/api/users/avatar/random')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('avatars');
            expect(Array.isArray(response.body.avatars)).toBe(true);
            expect(response.body.avatars.length).toBeGreaterThan(0);

            // 检查头像URL格式
            response.body.avatars.forEach(avatar => {
                expect(avatar.url).toContain('dicebear.com');
                expect(avatar.url).toContain('/svg');
                expect(avatar).toHaveProperty('style');
                expect(avatar).toHaveProperty('seed');
            });
        });

        test('使用特定种子生成头像', async () => {
            const seed = 'test-seed-123';
            const response = await request(app)
                .get(`/api/users/avatar/generate?seed=${seed}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('avatarUrl');
            expect(response.body.avatarUrl).toContain(seed);
            expect(response.body.avatarUrl).toContain('dicebear.com');
        });
    });
});