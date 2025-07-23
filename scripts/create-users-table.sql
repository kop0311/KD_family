-- KD Family Users Table Creation Script
-- This script creates the users table with all necessary fields for authentication

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('advisor', 'parent', 'member')),
    avatar_url TEXT,
    total_points INTEGER DEFAULT 0,
    group_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    last_logout TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user if no users exist
INSERT INTO users (username, email, password_hash, full_name, role, is_active, email_verified)
SELECT 
    'admin',
    'admin@kdfamily.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', -- password: admin123
    '系统管理员',
    'advisor',
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Insert sample family members for testing
INSERT INTO users (username, email, password_hash, full_name, role, is_active, email_verified)
SELECT 
    'parent1',
    'parent1@kdfamily.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', -- password: admin123
    '家长一号',
    'parent',
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'parent1');

INSERT INTO users (username, email, password_hash, full_name, role, is_active, email_verified)
SELECT 
    'child1',
    'child1@kdfamily.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK', -- password: admin123
    '孩子一号',
    'member',
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'child1');

-- Display created users
SELECT 
    id,
    username,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM users
ORDER BY created_at;
