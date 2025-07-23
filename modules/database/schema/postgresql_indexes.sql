-- PostgreSQL 性能优化索引 for KD Family database

-- 连接到数据库
\c kdfamily;

-- 用户表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_total_points ON users(total_points DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_level ON users(level DESC);

-- 任务表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_task_type_id ON tasks(task_type_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_approved_at ON tasks(approved_at);

-- 任务表复合索引（用于常见查询模式）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status_assigned ON tasks(status, assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_user_status ON tasks(assigned_to, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_type_status ON tasks(task_type_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_status ON tasks(due_date, status) WHERE due_date IS NOT NULL;

-- 任务表 JSONB 索引（用于元数据查询）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_metadata_gin ON tasks USING GIN(metadata);

-- 任务类型表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_types_code ON task_types(code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_types_active ON task_types(is_active);

-- 积分历史表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_history_task_id ON points_history(task_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_history_created_at ON points_history(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_history_user_created ON points_history(user_id, created_at);

-- 积分历史表 JSONB 索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_metadata_gin ON points_history USING GIN(metadata);

-- 通知表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_read_status ON notifications(is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- 通知表复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);

-- 通知表 JSONB 索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_metadata_gin ON notifications USING GIN(metadata);

-- 用户会话表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_last_used ON user_sessions(last_used_at);

-- 文件上传表索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_uploads_public ON file_uploads(is_public);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_uploads_mime_type ON file_uploads(mime_type);

-- 全文搜索索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_title_fts ON tasks USING GIN(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_description_fts ON tasks USING GIN(to_tsvector('english', description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_fullname_fts ON users USING GIN(to_tsvector('english', full_name));

-- 部分索引（用于特定条件的查询优化）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_active ON tasks(id, created_at) 
    WHERE status IN ('pending', 'claimed', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_overdue ON tasks(id, due_date, assigned_to) 
    WHERE due_date < CURRENT_TIMESTAMP AND status NOT IN ('completed', 'approved', 'rejected');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at) 
    WHERE is_read = FALSE;

-- 唯一索引
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_unique ON users(username);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_task_types_code_unique ON task_types(code);

-- 表统计信息更新
ANALYZE users;
ANALYZE tasks;
ANALYZE task_types;
ANALYZE points_history;
ANALYZE notifications;
ANALYZE user_sessions;
ANALYZE file_uploads;

-- 显示索引信息（用于验证）
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
