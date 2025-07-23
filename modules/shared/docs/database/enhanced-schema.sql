-- KD Family Enhanced Database Schema v2.0
-- Supports multiple families, enhanced task management, achievements, and analytics

USE kdfamily;

-- ====================
-- FAMILY MANAGEMENT
-- ====================

-- Enhanced families table
CREATE TABLE IF NOT EXISTS families (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    settings JSON,
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    theme_color VARCHAR(7) DEFAULT '#3b82f6',
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_family_code (code),
    INDEX idx_family_active (is_active)
);

-- Family membership with roles and permissions
CREATE TABLE IF NOT EXISTS family_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('parent', 'guardian', 'child', 'teen', 'observer') NOT NULL,
    permissions JSON,
    nickname VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    invited_by INT,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_active_family_user (family_id, user_id, is_active),
    INDEX idx_family_members_user (user_id),
    INDEX idx_family_members_family (family_id)
);

-- ====================
-- ENHANCED USER SYSTEM
-- ====================

-- Add family-related fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_family_id INT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS preferences JSON,
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Add foreign key for current family
ALTER TABLE users 
ADD CONSTRAINT fk_users_current_family 
FOREIGN KEY (current_family_id) REFERENCES families(id) ON DELETE SET NULL;

-- ====================
-- ENHANCED TASK SYSTEM
-- ====================

-- Enhanced task types with family-specific customization
ALTER TABLE task_types 
ADD COLUMN IF NOT EXISTS family_id INT,
ADD COLUMN IF NOT EXISTS icon VARCHAR(100) DEFAULT 'task',
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6b7280',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS estimated_duration INT DEFAULT 30,
ADD FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

-- Enhanced tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS family_id INT NOT NULL AFTER id,
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS estimated_duration INT DEFAULT 30,
ADD COLUMN IF NOT EXISTS actual_duration INT,
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS tags JSON,
ADD COLUMN IF NOT EXISTS requirements JSON,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS bonus_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_photo_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

-- Task assignments with enhanced tracking
CREATE TABLE IF NOT EXISTS task_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    assigned_to INT NOT NULL,
    assigned_by INT NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'in_progress', 'completed', 'verified', 'rejected') DEFAULT 'pending',
    message TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    verified_at TIMESTAMP NULL,
    due_date DATETIME,
    reminder_sent_at TIMESTAMP NULL,
    notes TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_assignments_task (task_id),
    INDEX idx_assignments_user (assigned_to),
    INDEX idx_assignments_status (status),
    INDEX idx_assignments_due (due_date)
);

-- Task attachments and photos
CREATE TABLE IF NOT EXISTS task_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    task_id INT NOT NULL,
    assignment_id INT,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    attachment_type ENUM('instruction', 'reference', 'completion_proof', 'other') DEFAULT 'other',
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES task_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_attachments_task (task_id),
    INDEX idx_attachments_assignment (assignment_id)
);

-- Task templates for recurring tasks
CREATE TABLE IF NOT EXISTS task_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    task_type_id INT NOT NULL,
    default_points INT DEFAULT 10,
    default_priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    estimated_duration INT DEFAULT 30,
    requirements JSON,
    recurrence_pattern JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (task_type_id) REFERENCES task_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_templates_family (family_id),
    INDEX idx_templates_active (is_active)
);

-- ====================
-- POINTS & ACHIEVEMENTS
-- ====================

-- Enhanced points history with categories
ALTER TABLE points_history 
ADD COLUMN IF NOT EXISTS family_id INT NOT NULL AFTER id,
ADD COLUMN IF NOT EXISTS category ENUM('task_completion', 'bonus', 'penalty', 'adjustment', 'achievement', 'streak') DEFAULT 'task_completion',
ADD COLUMN IF NOT EXISTS streak_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSON,
ADD FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

-- User points summary table for performance
CREATE TABLE IF NOT EXISTS user_points_summary (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    family_id INT NOT NULL,
    total_points INT DEFAULT 0,
    weekly_points INT DEFAULT 0,
    monthly_points INT DEFAULT 0,
    yearly_points INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    week_start_date DATE,
    month_start_date DATE,
    year_start_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_family_points (user_id, family_id),
    INDEX idx_points_summary_family (family_id),
    INDEX idx_points_summary_weekly (weekly_points),
    INDEX idx_points_summary_total (total_points)
);

-- Achievements system
CREATE TABLE IF NOT EXISTS achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) DEFAULT 'trophy',
    color VARCHAR(7) DEFAULT '#ffd700',
    criteria JSON NOT NULL,
    points_reward INT DEFAULT 0,
    badge_level ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_achievements_family (family_id),
    INDEX idx_achievements_active (is_active),
    INDEX idx_achievements_system (is_system)
);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_earned INT DEFAULT 0,
    progress_data JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_achievements_user (user_id),
    INDEX idx_user_achievements_earned (earned_at)
);

-- Rewards system
CREATE TABLE IF NOT EXISTS rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points_cost INT NOT NULL,
    category ENUM('privilege', 'treat', 'activity', 'item', 'experience') DEFAULT 'treat',
    icon VARCHAR(100) DEFAULT 'gift',
    color VARCHAR(7) DEFAULT '#10b981',
    is_active BOOLEAN DEFAULT TRUE,
    max_per_month INT,
    age_restriction JSON,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_rewards_family (family_id),
    INDEX idx_rewards_active (is_active),
    INDEX idx_rewards_cost (points_cost)
);

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_spent INT NOT NULL,
    status ENUM('pending', 'approved', 'fulfilled', 'cancelled') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    fulfilled_at TIMESTAMP NULL,
    approved_by INT,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_redemptions_user (user_id),
    INDEX idx_redemptions_status (status),
    INDEX idx_redemptions_requested (requested_at)
);

-- ====================
-- NOTIFICATIONS & COMMUNICATION
-- ====================

-- Enhanced notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS family_id INT AFTER user_id,
ADD COLUMN IF NOT EXISTS category ENUM('system', 'task', 'achievement', 'social', 'reminder') DEFAULT 'system',
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS action_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS action_text VARCHAR(100),
ADD COLUMN IF NOT EXISTS data JSON,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL,
ADD FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    task_assigned BOOLEAN DEFAULT TRUE,
    task_completed BOOLEAN DEFAULT TRUE,
    task_overdue BOOLEAN DEFAULT TRUE,
    points_earned BOOLEAN DEFAULT TRUE,
    achievement_earned BOOLEAN DEFAULT TRUE,
    family_activity BOOLEAN DEFAULT FALSE,
    weekly_report BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    timezone VARCHAR(50) DEFAULT 'UTC',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
);

-- Family activity feed
CREATE TABLE IF NOT EXISTS activity_feed (
    id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT NOT NULL,
    user_id INT NOT NULL,
    activity_type ENUM('task_created', 'task_completed', 'achievement_earned', 'member_joined', 'points_awarded') NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_activity_family (family_id),
    INDEX idx_activity_created (created_at),
    INDEX idx_activity_visible (is_visible)
);

-- ====================
-- ANALYTICS & REPORTING
-- ====================

-- Daily family statistics
CREATE TABLE IF NOT EXISTS daily_family_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    family_id INT NOT NULL,
    stat_date DATE NOT NULL,
    tasks_created INT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    tasks_overdue INT DEFAULT 0,
    total_points_earned INT DEFAULT 0,
    active_members INT DEFAULT 0,
    avg_completion_time DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    UNIQUE KEY unique_family_date (family_id, stat_date),
    INDEX idx_family_stats_date (stat_date)
);

-- User performance metrics
CREATE TABLE IF NOT EXISTS user_performance_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    family_id INT NOT NULL,
    metric_date DATE NOT NULL,
    tasks_assigned INT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    tasks_overdue INT DEFAULT 0,
    points_earned INT DEFAULT 0,
    avg_completion_time DECIMAL(10,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    streak_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_family_date (user_id, family_id, metric_date),
    INDEX idx_performance_date (metric_date),
    INDEX idx_performance_user (user_id)
);

-- ====================
-- SYSTEM CONFIGURATION
-- ====================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_settings_key (setting_key),
    INDEX idx_settings_public (is_public)
);

-- ====================
-- ENHANCED INDEXES
-- ====================

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_family_status ON tasks(family_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_family_priority ON tasks(family_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date_status ON tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_points_history_user_family ON points_history(user_id, family_id);
CREATE INDEX IF NOT EXISTS idx_points_history_date ON points_history(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_activity_family_date ON activity_feed(family_id, created_at);

-- ====================
-- DEFAULT DATA
-- ====================

-- Insert default system achievements
INSERT IGNORE INTO achievements (name, description, icon, criteria, points_reward, is_system) VALUES
('First Task', 'Complete your first task', 'star', '{"task_count": 1}', 10, TRUE),
('Task Master', 'Complete 100 tasks', 'trophy', '{"task_count": 100}', 100, TRUE),
('Streak Champion', 'Maintain a 7-day completion streak', 'fire', '{"streak_days": 7}', 50, TRUE),
('Early Bird', 'Complete 10 tasks before their due date', 'clock', '{"early_completions": 10}', 25, TRUE),
('Team Player', 'Help complete family tasks for 30 days', 'heart', '{"team_days": 30}', 75, TRUE);

-- Insert default system settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('default_points_per_task', '10', 'Default points awarded per task completion', TRUE),
('max_family_members', '20', 'Maximum number of members per family', FALSE),
('task_overdue_hours', '24', 'Hours after due date before task is marked overdue', TRUE),
('achievement_check_interval', '3600', 'Seconds between achievement progress checks', FALSE),
('file_upload_max_size', '10485760', 'Maximum file upload size in bytes (10MB)', FALSE);

-- ====================
-- TRIGGERS FOR AUTOMATION
-- ====================

-- Update user points summary when points history changes
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_user_points_summary 
AFTER INSERT ON points_history
FOR EACH ROW
BEGIN
    INSERT INTO user_points_summary (user_id, family_id, total_points, weekly_points, monthly_points, yearly_points)
    VALUES (NEW.user_id, NEW.family_id, NEW.points_change, 
            CASE WHEN YEARWEEK(NEW.created_at) = YEARWEEK(NOW()) THEN NEW.points_change ELSE 0 END,
            CASE WHEN YEAR(NEW.created_at) = YEAR(NOW()) AND MONTH(NEW.created_at) = MONTH(NOW()) THEN NEW.points_change ELSE 0 END,
            CASE WHEN YEAR(NEW.created_at) = YEAR(NOW()) THEN NEW.points_change ELSE 0 END)
    ON DUPLICATE KEY UPDATE
        total_points = total_points + NEW.points_change,
        weekly_points = CASE WHEN YEARWEEK(NEW.created_at) = YEARWEEK(NOW()) THEN weekly_points + NEW.points_change ELSE weekly_points END,
        monthly_points = CASE WHEN YEAR(NEW.created_at) = YEAR(NOW()) AND MONTH(NEW.created_at) = MONTH(NOW()) THEN monthly_points + NEW.points_change ELSE monthly_points END,
        yearly_points = CASE WHEN YEAR(NEW.created_at) = YEAR(NOW()) THEN yearly_points + NEW.points_change ELSE yearly_points END,
        updated_at = NOW();
END//
DELIMITER ;

-- Create activity feed entry for task completions
DELIMITER //
CREATE TRIGGER IF NOT EXISTS create_task_completion_activity 
AFTER UPDATE ON task_assignments
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO activity_feed (family_id, user_id, activity_type, message, data)
        SELECT t.family_id, NEW.assigned_to, 'task_completed', 
               CONCAT(u.full_name, ' completed task: ', t.title),
               JSON_OBJECT('task_id', t.id, 'points', t.points)
        FROM tasks t 
        JOIN users u ON u.id = NEW.assigned_to
        WHERE t.id = NEW.task_id;
    END IF;
END//
DELIMITER ;