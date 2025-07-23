# Database Module

## Overview
PostgreSQL database schema, migration scripts, and database management tools.

## Structure
- `schema/` - Database schema definitions
  - `postgresql_init.sql` - Initial database setup
  - `postgresql_indexes.sql` - Performance indexes
- `scripts/` - Database management scripts
  - `migrate-mysql-to-postgresql.sh` - Migration script
  - `performance-test.js` - Database performance testing
  - `verify-migration.js` - Migration verification
- `migration_backup/` - Migration backups and reports
- `migrations/` - Database migration files
- `data/` - Sample data and fixtures

## Key Features
- PostgreSQL 15 with advanced features
- Automated migration from MySQL
- Performance optimization scripts
- Data integrity verification
- Backup and restore capabilities

## Usage
```bash
# Initialize database
docker exec -i postgres psql -U kdfamily_user -d kdfamily < schema/postgresql_init.sql

# Create indexes
docker exec -i postgres psql -U kdfamily_user -d kdfamily < schema/postgresql_indexes.sql

# Run performance tests
node scripts/performance-test.js

# Verify migration
node scripts/verify-migration.js
```

## Database Schema
- `users` - User accounts and profiles
- `tasks` - Task management
- `task_types` - Task categorization
- `points_history` - Points and rewards tracking
- `notifications` - User notifications
- `user_sessions` - Session management
- `file_uploads` - File management
