-- KD Family JSON字段默认值初始化脚本
-- 由于MySQL 8.0不支持JSON字段默认值，需要在插入时手动设置

-- 在插入families表时，确保settings字段有默认值
UPDATE families SET settings = '{}' WHERE settings IS NULL;

-- 在插入family_members表时，确保permissions字段有默认值
UPDATE family_members SET permissions = '[]' WHERE permissions IS NULL;

-- 在插入users表时，确保preferences字段有默认值
UPDATE users SET preferences = '{}' WHERE preferences IS NULL;

-- 在插入tasks表时，确保JSON字段有默认值
UPDATE tasks SET tags = '[]' WHERE tags IS NULL;
UPDATE tasks SET requirements = '[]' WHERE requirements IS NULL;

-- 在插入task_templates表时，确保JSON字段有默认值
UPDATE task_templates SET requirements = '[]' WHERE requirements IS NULL;
UPDATE task_templates SET recurrence_pattern = '{}' WHERE recurrence_pattern IS NULL;

-- 在插入points_history表时，确保metadata字段有默认值
UPDATE points_history SET metadata = '{}' WHERE metadata IS NULL;

-- 在插入user_achievements表时，确保progress_data字段有默认值
UPDATE user_achievements SET progress_data = '{}' WHERE progress_data IS NULL;

-- 在插入rewards表时，确保age_restriction字段有默认值
UPDATE rewards SET age_restriction = '{}' WHERE age_restriction IS NULL;

-- 在插入notifications表时，确保data字段有默认值
UPDATE notifications SET data = '{}' WHERE data IS NULL;

-- 在插入activity_feed表时，确保data字段有默认值
UPDATE activity_feed SET data = '{}' WHERE data IS NULL;