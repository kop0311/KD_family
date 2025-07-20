const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../utils/logger');

class SQLiteDatabase {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/kdfamily.db');
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('SQLite connection failed:', err);
          reject(err);
        } else {
          logger.info('Connected to SQLite database');
          this.initializeTables();
          resolve();
        }
      });
    });
  }

  async initializeTables() {
    const createTables = `
      PRAGMA foreign_keys = OFF;

      CREATE TABLE IF NOT EXISTS family_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        primary_role TEXT DEFAULT 'member',
        avatar_url VARCHAR(500),
        group_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS task_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        default_points INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        task_type_id INTEGER DEFAULT 1,
        points INTEGER DEFAULT 0,
        assigned_to INTEGER,
        created_by INTEGER NOT NULL,
        approved_by INTEGER,
        status VARCHAR(20) DEFAULT 'available',
        due_date DATETIME,
        completed_at DATETIME,
        approved_at DATETIME,
        is_recurring BOOLEAN DEFAULT FALSE,
        recurrence_pattern VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS points_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        task_id INTEGER,
        points_change INTEGER NOT NULL,
        total_points INTEGER DEFAULT 0,
        reason VARCHAR(255),
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );



      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT CHECK(role IN ('advisor', 'parent', 'member')) NOT NULL,
        granted_by INTEGER NOT NULL,
        granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id),
        UNIQUE(user_id, role)
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        points_earned INTEGER DEFAULT 0,
        task_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id)
      );

      CREATE TABLE IF NOT EXISTS custom_task_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        default_points INTEGER DEFAULT 10,
        category VARCHAR(50),
        icon VARCHAR(50),
        color VARCHAR(7),
        group_id INTEGER,
        created_by INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES family_groups(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS task_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        task_type_id INTEGER NOT NULL,
        default_points INTEGER,
        recurrence_pattern VARCHAR(50),
        group_id INTEGER,
        created_by INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_type_id) REFERENCES custom_task_types(id),
        FOREIGN KEY (group_id) REFERENCES family_groups(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      PRAGMA foreign_keys = ON;
    `;

    return new Promise((resolve, reject) => {
      // Split the SQL into individual statements and execute them one by one
      const statements = createTables.split(';').filter(stmt => stmt.trim().length > 0);
      logger.info(`Found ${statements.length} SQL statements to execute`);

      const executeStatements = (index) => {
        if (index >= statements.length) {
          logger.info('SQLite tables initialized');

          // Debug: Check what tables were created (with a small delay to ensure completion)
          setTimeout(() => {
            this.db.all("SELECT name FROM sqlite_master WHERE type='table'", (debugErr, tables) => {
              if (!debugErr) {
                logger.info('Created tables:', tables.map(t => t.name).join(', '));
              }
            });
          }, 100);

          // Run migrations to ensure schema is up to date
          this.runMigrations().then(() => {
            // Insert default admin user if not exists
            this.seedDefaultData().then(() => {
              resolve();
            }).catch((seedErr) => {
              logger.error('Seed data insertion failed:', seedErr);
              resolve(); // Don't fail if seed data fails
            });
          }).catch((migrationErr) => {
            logger.error('Migration failed:', migrationErr);
            resolve(); // Don't fail if migration fails
          });
          return;
        }

        const statement = statements[index].trim();
        if (statement) {
          logger.info(`Executing statement ${index + 1}: ${statement.substring(0, 50)}...`);
          this.db.run(statement, (err) => {
            if (err) {
              logger.error(`Failed to execute statement ${index + 1}:`, statement);
              logger.error('Error:', err);
              reject(err);
            } else {
              logger.info(`Successfully executed statement ${index + 1}`);
              executeStatements(index + 1);
            }
          });
        } else {
          logger.info(`Skipping empty statement ${index + 1}`);
          executeStatements(index + 1);
        }
      };

      executeStatements(0);
    });
  }

  async runMigrations() {
    return new Promise(async (resolve, reject) => {
      try {
        // Check user table columns
        const userColumns = await new Promise((res, rej) => {
          this.db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) rej(err);
            else res(columns);
          });
        });

        const hasAvatarUrl = userColumns.some(col => col.name === 'avatar_url');
        if (!hasAvatarUrl) {
          logger.info('Adding avatar_url column to users table');
          await new Promise((res, rej) => {
            this.db.run("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)", (err) => {
              if (err) rej(err);
              else res();
            });
          });
          logger.info('avatar_url column added successfully');
        }

        // Check if primary_role column exists, if not add it and migrate data
        const hasPrimaryRole = userColumns.some(col => col.name === 'primary_role');
        if (!hasPrimaryRole) {
          logger.info('Adding primary_role column and migrating role data');
          await new Promise((res, rej) => {
            this.db.run("ALTER TABLE users ADD COLUMN primary_role TEXT CHECK(primary_role IN ('advisor', 'parent', 'member')) DEFAULT 'member'", (err) => {
              if (err) rej(err);
              else res();
            });
          });

          // Migrate existing role data to primary_role
          await new Promise((res, rej) => {
            this.db.run("UPDATE users SET primary_role = role WHERE role IS NOT NULL", (err) => {
              if (err) rej(err);
              else res();
            });
          });
          logger.info('primary_role column added and data migrated successfully');
        }

        // Check if group_id column exists, if not add it
        const hasGroupId = userColumns.some(col => col.name === 'group_id');
        if (!hasGroupId) {
          logger.info('Adding group_id column to users table');
          await new Promise((res, rej) => {
            this.db.run("ALTER TABLE users ADD COLUMN group_id INTEGER", (err) => {
              if (err) rej(err);
              else res();
            });
          });
          logger.info('group_id column added successfully');
        }

        // Check tasks table columns and migrate
        const taskColumns = await new Promise((res, rej) => {
          this.db.all("PRAGMA table_info(tasks)", (err, columns) => {
            if (err) rej(err);
            else res(columns);
          });
        });

        // Check if tasks table has new schema
        const hasTitle = taskColumns.some(col => col.name === 'title');
        const hasStatus = taskColumns.some(col => col.name === 'status');
        const hasTaskTypeId = taskColumns.some(col => col.name === 'task_type_id');
        const hasApprovedAt = taskColumns.some(col => col.name === 'approved_at');
        const hasApprovedBy = taskColumns.some(col => col.name === 'approved_by');
        const hasDueDate = taskColumns.some(col => col.name === 'due_date');
        const hasIsRecurring = taskColumns.some(col => col.name === 'is_recurring');
        const hasRecurrencePattern = taskColumns.some(col => col.name === 'recurrence_pattern');

        if (!hasTitle || !hasStatus || !hasTaskTypeId) {
          logger.info('Migrating tasks table to new schema');
          
          // Backup existing tasks data
          const existingTasks = await new Promise((res, rej) => {
            this.db.all("SELECT * FROM tasks", (err, rows) => {
              if (err) rej(err);
              else res(rows);
            });
          });

          // Drop old tasks table and recreate with new schema
          await new Promise((res, rej) => {
            this.db.run("DROP TABLE tasks", (err) => {
              if (err) rej(err);
              else res();
            });
          });

          // Create new tasks table
          await new Promise((res, rej) => {
            this.db.run(`
              CREATE TABLE tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                task_type_id INTEGER DEFAULT 1,
                points INTEGER DEFAULT 0,
                assigned_to INTEGER,
                created_by INTEGER NOT NULL,
                approved_by INTEGER,
                status VARCHAR(20) DEFAULT 'available',
                due_date DATETIME,
                completed_at DATETIME,
                approved_at DATETIME,
                is_recurring BOOLEAN DEFAULT FALSE,
                recurrence_pattern VARCHAR(50),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
              )
            `, (err) => {
              if (err) rej(err);
              else res();
            });
          });

          // Migrate existing data
          for (const task of existingTasks) {
            await new Promise((res, rej) => {
              this.db.run(`
                INSERT INTO tasks (id, title, description, task_type_id, points, assigned_to, created_by, status, completed_at, created_at, updated_at)
                VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
              `, [
                task.id,
                task.name || 'Migrated Task',
                task.description || '',
                task.points || 10,
                task.assigned_to,
                task.created_by || 1,
                task.completed ? 'completed' : 'available',
                task.completed_at,
                task.created_at,
                task.updated_at
              ], (err) => {
                if (err) rej(err);
                else res();
              });
            });
          }
          
          logger.info('Tasks table migrated successfully');
        } else {
          // Add missing columns to existing new-schema tasks table
          if (!hasApprovedAt) {
            await new Promise((res, rej) => {
              this.db.run("ALTER TABLE tasks ADD COLUMN approved_at DATETIME", (err) => {
                if (err) rej(err);
                else res();
              });
            });
            logger.info('approved_at column added to tasks table');
          }

          if (!hasApprovedBy) {
            await new Promise((res, rej) => {
              this.db.run("ALTER TABLE tasks ADD COLUMN approved_by INTEGER", (err) => {
                if (err) rej(err);
                else res();
              });
            });
            logger.info('approved_by column added to tasks table');
          }

          if (!hasDueDate) {
            await new Promise((res, rej) => {
              this.db.run("ALTER TABLE tasks ADD COLUMN due_date DATETIME", (err) => {
                if (err) rej(err);
                else res();
              });
            });
            logger.info('due_date column added to tasks table');
          }

          if (!hasIsRecurring) {
            await new Promise((res, rej) => {
              this.db.run("ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE", (err) => {
                if (err) rej(err);
                else res();
              });
            });
            logger.info('is_recurring column added to tasks table');
          }

          if (!hasRecurrencePattern) {
            await new Promise((res, rej) => {
              this.db.run("ALTER TABLE tasks ADD COLUMN recurrence_pattern VARCHAR(50)", (err) => {
                if (err) rej(err);
                else res();
              });
            });
            logger.info('recurrence_pattern column added to tasks table');
          }
        }

        logger.info('All migrations completed successfully');
        resolve();
      } catch (error) {
        logger.error('Migration failed:', error);
        reject(error);
      }
    });
  }

  async seedDefaultData() {
    const bcrypt = require('bcryptjs');

    // Check if admin user exists
    const existingAdmin = await this.query('SELECT id FROM users WHERE username = ?', ['admin']);

    if (existingAdmin.length === 0) {
      // Create default admin user
      const passwordHash = await bcrypt.hash('admin123', 12);
      await this.run(
        'INSERT INTO users (username, email, password, full_name, primary_role) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@kdfamily.com', passwordHash, '系统管理员', 'advisor']
      );
      logger.info('Default admin user created');
    }

    // Check if default task types exist
    const existingTaskTypes = await this.query('SELECT id FROM task_types');

    if (existingTaskTypes.length === 0) {
      // Create default task types
      const defaultTaskTypes = [
        { code: 'CHORE', name: '家务活', description: '日常家务任务', default_points: 10 },
        { code: 'STUDY', name: '学习任务', description: '学习相关任务', default_points: 15 },
        { code: 'EXERCISE', name: '运动健身', description: '体育锻炼任务', default_points: 20 },
        { code: 'HELP', name: '帮助他人', description: '帮助家庭成员的任务', default_points: 25 },
        { code: 'SPECIAL', name: '特殊任务', description: '特殊或一次性任务', default_points: 30 }
      ];

      for (const taskType of defaultTaskTypes) {
        await this.run(
          'INSERT INTO task_types (code, name, description, default_points) VALUES (?, ?, ?, ?)',
          [taskType.code, taskType.name, taskType.description, taskType.default_points]
        );
      }

      logger.info('Default task types created');
    }
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('SQLite query failed:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('SQLite run failed:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('SQLite close error:', err);
          } else {
            logger.info('SQLite database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new SQLiteDatabase();