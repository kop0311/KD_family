-- KD Family 数据库初始化脚本
USE kdfamily;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('advisor', 'parent', 'member') DEFAULT 'member',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建任务类型表
CREATE TABLE IF NOT EXISTS task_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    default_points INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认任务类型
INSERT IGNORE INTO task_types (code, name, description, default_points) VALUES
('PM', '整理房间', '收拾和整理个人房间', 15),
('FTL', '客厅整理', '客厅区域的清洁和整理', 20),
('PA', '个人事务', '完成个人相关的任务', 10),
('UBI', '通用家务', '其他类型的家庭事务', 12);

-- 创建任务表
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type_id INT,
    status ENUM('pending', 'claimed', 'in_progress', 'completed', 'approved', 'rejected') DEFAULT 'pending',
    points INT DEFAULT 10,
    assigned_to INT,
    created_by INT NOT NULL,
    approved_by INT,
    due_date DATETIME,
    completed_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern ENUM('daily', 'weekly', 'monthly'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_type_id) REFERENCES task_types(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 创建积分历史表
CREATE TABLE IF NOT EXISTS points_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    task_id INT,
    points_change INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('system', 'task_assigned', 'task_completed', 'points_earned') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 插入示例管理员用户
INSERT IGNORE INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@kdfamily.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeU5l8InyJoiJCTU6', '系统管理员', 'advisor');
-- 密码是: admin123

-- 插入示例任务
INSERT IGNORE INTO tasks (title, description, task_type_id, created_by, points) VALUES
('整理卧室', '收拾卧室，整理床铺和书桌', 1, 1, 15),
('清洁客厅', '吸尘、擦拭家具、整理沙发', 2, 1, 20),
('完成作业', '完成当天的学习任务', 3, 1, 10);