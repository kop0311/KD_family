-- Family Chore Scoring System Database Schema
-- Database: nzaklcom_kdfamily

-- Users table for family members
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    role ENUM('advisor', 'parent', 'member') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Task categories
CREATE TABLE task_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    default_points INT DEFAULT 0,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default task types
INSERT INTO task_types (code, name, description, default_points, is_recurring) VALUES
('PM', 'Project Management', 'Activity planning and project management tasks', 10, FALSE),
('FTL', 'Fixed Task List', 'Daily fixed tasks like dishwashing', 5, TRUE),
('PA', 'Project Assistance', 'Helper tasks like room cleaning', 3, FALSE),
('UBI', 'Daily Must-Do', 'Essential daily tasks like grocery shopping and cooking', 5, TRUE);

-- Tasks table
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type_id INT NOT NULL,
    assigned_to INT,
    created_by INT NOT NULL,
    status ENUM('pending', 'claimed', 'in_progress', 'completed', 'approved') DEFAULT 'pending',
    points INT NOT NULL,
    due_date DATE,
    completed_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    approved_by INT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_type_id) REFERENCES task_types(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- UBI task lists (template for daily must-do tasks)
CREATE TABLE ubi_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Points history for tracking all point changes
CREATE TABLE points_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    task_id INT,
    points_change INT NOT NULL,
    total_points INT NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Weekly settlements and awards
CREATE TABLE weekly_settlements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    winner_id INT,
    medal_image_url VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_id) REFERENCES users(id)
);

-- User weekly rankings
CREATE TABLE weekly_rankings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    settlement_id INT NOT NULL,
    user_id INT NOT NULL,
    rank_position INT NOT NULL,
    total_points INT NOT NULL,
    tasks_completed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (settlement_id) REFERENCES weekly_settlements(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type ENUM('task_due', 'points_earned', 'approval_needed', 'system') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System configuration
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default system configurations
INSERT INTO system_config (config_key, config_value, description) VALUES
('points_pm_default', '10', 'Default points for PM tasks'),
('points_ftl_default', '5', 'Default points for FTL tasks'),
('points_pa_default', '3', 'Default points for PA tasks'),
('points_ubi_default', '5', 'Default points for UBI tasks'),
('notification_task_due_hours', '24', 'Hours before due date to send notification'),
('weekly_settlement_day', 'friday', 'Day of week for weekly settlements');

-- Create indexes for better performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_points_history_user_id ON points_history(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);