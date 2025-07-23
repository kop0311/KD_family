-- KD Family PostgreSQL 数据库初始化脚本
-- 从 MySQL 迁移到 PostgreSQL

-- 连接到数据库（在 Docker 环境中会自动创建）
\c kdfamily;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建枚举类型
CREATE TYPE user_role AS ENUM ('advisor', 'parent', 'member');
CREATE TYPE task_status AS ENUM ('pending', 'claimed', 'in_progress', 'completed', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('system', 'task_assigned', 'task_completed', 'points_earned');
CREATE TYPE recurrence_pattern AS ENUM ('daily', 'weekly', 'monthly');

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'member',
    avatar_url VARCHAR(500),
    bio TEXT,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表创建更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建任务类型表
CREATE TABLE IF NOT EXISTS task_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    default_points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认任务类型
INSERT INTO task_types (code, name, description, default_points) VALUES
('PM', '整理房间', '收拾和整理个人房间', 15),
('FTL', '客厅整理', '客厅区域的清洁和整理', 20),
('PA', '个人事务', '完成个人相关的任务', 10),
('UBI', '通用家务', '其他类型的家庭事务', 12)
ON CONFLICT (code) DO NOTHING;

-- 创建任务表
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type_id INTEGER,
    status task_status DEFAULT 'pending',
    points INTEGER DEFAULT 10,
    assigned_to INTEGER,
    created_by INTEGER NOT NULL,
    approved_by INTEGER,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern recurrence_pattern,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_task_type FOREIGN KEY (task_type_id) REFERENCES task_types(id),
    CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id),
    CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_tasks_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 为任务表创建更新时间触发器
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建积分历史表
CREATE TABLE IF NOT EXISTS points_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_id INTEGER,
    points_change INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_by INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_points_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_points_task FOREIGN KEY (task_id) REFERENCES tasks(id),
    CONSTRAINT fk_points_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建用户会话表（用于JWT管理）
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建文件上传表
CREATE TABLE IF NOT EXISTS file_uploads (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_uploads_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 插入示例管理员用户
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@kdfamily.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeU5l8InyJoiJCTU6', '系统管理员', 'advisor')
ON CONFLICT (username) DO NOTHING;
-- 密码是: admin123

-- 插入示例任务
INSERT INTO tasks (title, description, task_type_id, created_by, points) VALUES
('整理卧室', '收拾卧室，整理床铺和书桌', 1, 1, 15),
('清洁客厅', '吸尘、擦拭家具、整理沙发', 2, 1, 20),
('完成作业', '完成当天的学习任务', 3, 1, 10)
ON CONFLICT DO NOTHING;

-- 创建视图：用户统计
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.total_points,
    u.level,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as active_tasks,
    COALESCE(SUM(CASE WHEN t.status = 'approved' THEN t.points END), 0) as earned_points
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.username, u.full_name, u.total_points, u.level;

-- 创建函数：更新用户总积分
CREATE OR REPLACE FUNCTION update_user_total_points()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users 
        SET total_points = total_points + NEW.points_change
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users 
        SET total_points = total_points - OLD.points_change
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新用户总积分
CREATE TRIGGER trigger_update_user_points
    AFTER INSERT OR DELETE ON points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_user_total_points();

-- 创建函数：计算用户等级
CREATE OR REPLACE FUNCTION calculate_user_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE 
        WHEN points >= 1000 THEN 10
        WHEN points >= 800 THEN 9
        WHEN points >= 600 THEN 8
        WHEN points >= 450 THEN 7
        WHEN points >= 320 THEN 6
        WHEN points >= 210 THEN 5
        WHEN points >= 120 THEN 4
        WHEN points >= 50 THEN 3
        WHEN points >= 10 THEN 2
        ELSE 1
    END;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：更新用户等级
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level = calculate_user_level(NEW.total_points);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动更新用户等级
CREATE TRIGGER trigger_update_user_level
    BEFORE UPDATE OF total_points ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_level();

-- 创建索引（在下一个文件中定义）
