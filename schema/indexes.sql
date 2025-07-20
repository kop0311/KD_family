-- Performance optimization indexes for KD Family database

USE kdfamily;

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Indexes for tasks table
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type_id ON tasks(task_type_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_status_assigned ON tasks(status, assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(assigned_to, status);

-- Indexes for points table (if exists)
-- Note: Add these when points table is created
-- CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);
-- CREATE INDEX IF NOT EXISTS idx_points_task_id ON points(task_id);
-- CREATE INDEX IF NOT EXISTS idx_points_created_at ON points(created_at);

-- Indexes for notifications table (if exists)
-- CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
-- CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(is_read);
-- CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Show index information
SHOW INDEX FROM users;
SHOW INDEX FROM tasks;
SHOW INDEX FROM task_types;