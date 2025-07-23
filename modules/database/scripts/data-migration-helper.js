// 数据迁移辅助脚本 - Node.js 版本
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// 配置
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3307,
  user: process.env.MYSQL_USER || 'kdfamily_user',
  password: process.env.MYSQL_PASSWORD || 'kdfamily_pass',
  database: process.env.MYSQL_DATABASE || 'kdfamily'
};

const POSTGRES_CONFIG = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5433,
  user: process.env.POSTGRES_USER || 'kdfamily_user',
  password: process.env.POSTGRES_PASSWORD || 'kdfamily_pass',
  database: process.env.POSTGRES_DATABASE || 'kdfamily'
};

const BACKUP_DIR = './migration_backup';
const TEMP_DIR = './migration_temp';

class DataMigrationHelper {
  constructor() {
    this.mysqlConnection = null;
    this.postgresPool = null;
  }

  // 初始化数据库连接
  async initialize() {
    try {
      console.log('🔗 初始化数据库连接...');
      
      // 连接 MySQL
      this.mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
      console.log('✅ MySQL 连接成功');
      
      // 连接 PostgreSQL
      this.postgresPool = new Pool(POSTGRES_CONFIG);
      await this.postgresPool.query('SELECT NOW()');
      console.log('✅ PostgreSQL 连接成功');
      
      // 创建目录
      await this.createDirectories();
      
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  // 创建工作目录
  async createDirectories() {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      await fs.mkdir(TEMP_DIR, { recursive: true });
      console.log('📁 工作目录创建完成');
    } catch (error) {
      console.error('❌ 创建目录失败:', error);
      throw error;
    }
  }

  // 备份 MySQL 数据
  async backupMySQLData() {
    try {
      console.log('💾 开始备份 MySQL 数据...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(BACKUP_DIR, `mysql_backup_${timestamp}.json`);
      
      const tables = ['users', 'task_types', 'tasks', 'points_history', 'notifications'];
      const backup = {};
      
      for (const table of tables) {
        console.log(`📋 备份表: ${table}`);
        const [rows] = await this.mysqlConnection.execute(`SELECT * FROM ${table}`);
        backup[table] = rows;
      }
      
      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
      console.log(`✅ MySQL 数据备份完成: ${backupFile}`);
      
      return backupFile;
    } catch (error) {
      console.error('❌ MySQL 数据备份失败:', error);
      throw error;
    }
  }

  // 转换数据格式
  convertDataForPostgreSQL(data, tableName) {
    if (!Array.isArray(data)) return data;
    
    return data.map(row => {
      const convertedRow = { ...row };
      
      // 处理日期时间字段
      for (const [key, value] of Object.entries(convertedRow)) {
        if (value instanceof Date) {
          convertedRow[key] = value.toISOString();
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
          convertedRow[key] = new Date(value).toISOString();
        }
      }
      
      // 表特定的转换
      switch (tableName) {
        case 'users':
          // 处理布尔值
          if ('is_active' in convertedRow) {
            convertedRow.is_active = Boolean(convertedRow.is_active);
          }
          break;
          
        case 'tasks':
          // 处理布尔值
          if ('is_recurring' in convertedRow) {
            convertedRow.is_recurring = Boolean(convertedRow.is_recurring);
          }
          // 处理 JSON 字段
          if (convertedRow.metadata && typeof convertedRow.metadata === 'string') {
            try {
              convertedRow.metadata = JSON.parse(convertedRow.metadata);
            } catch (e) {
              convertedRow.metadata = {};
            }
          }
          break;
          
        case 'notifications':
          // 处理布尔值
          if ('is_read' in convertedRow) {
            convertedRow.is_read = Boolean(convertedRow.is_read);
          }
          break;
      }
      
      return convertedRow;
    });
  }

  // 导入数据到 PostgreSQL
  async importDataToPostgreSQL(backupFile) {
    try {
      console.log('📥 开始导入数据到 PostgreSQL...');
      
      const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
      
      // 导入顺序很重要（考虑外键约束）
      const importOrder = ['task_types', 'users', 'tasks', 'points_history', 'notifications'];
      
      const client = await this.postgresPool.connect();
      
      try {
        await client.query('BEGIN');
        
        // 临时禁用触发器
        await client.query('SET session_replication_role = replica');
        
        for (const tableName of importOrder) {
          if (!backupData[tableName]) {
            console.log(`⚠️  表 ${tableName} 没有数据，跳过`);
            continue;
          }
          
          console.log(`📋 导入表: ${tableName}`);
          
          // 清空表
          await client.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
          
          const data = this.convertDataForPostgreSQL(backupData[tableName], tableName);
          
          if (data.length === 0) {
            console.log(`⚠️  表 ${tableName} 没有数据`);
            continue;
          }
          
          // 获取表结构
          const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
            ORDER BY ordinal_position
          `, [tableName]);
          
          const columns = columnsResult.rows
            .filter(col => col.column_name !== 'id') // 跳过自增ID
            .map(col => col.column_name);
          
          if (columns.length === 0) {
            console.log(`⚠️  表 ${tableName} 没有可导入的列`);
            continue;
          }
          
          // 批量插入数据
          for (const row of data) {
            const values = columns.map(col => row[col] !== undefined ? row[col] : null);
            const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
            
            const insertSQL = `
              INSERT INTO ${tableName} (${columns.join(', ')})
              VALUES (${placeholders})
            `;
            
            try {
              await client.query(insertSQL, values);
            } catch (insertError) {
              console.error(`❌ 插入数据失败 (${tableName}):`, insertError.message);
              console.error('数据:', row);
              // 继续处理其他行
            }
          }
          
          console.log(`✅ 表 ${tableName} 导入完成 (${data.length} 条记录)`);
        }
        
        // 重新启用触发器
        await client.query('SET session_replication_role = DEFAULT');
        
        // 更新序列
        for (const tableName of importOrder) {
          try {
            await client.query(`
              SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
                     COALESCE(MAX(id), 1)) 
              FROM ${tableName}
            `);
          } catch (seqError) {
            console.warn(`⚠️  更新序列失败 (${tableName}):`, seqError.message);
          }
        }
        
        await client.query('COMMIT');
        console.log('✅ 数据导入完成');
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ 数据导入失败:', error);
      throw error;
    }
  }

  // 验证数据完整性
  async verifyDataIntegrity() {
    try {
      console.log('🔍 验证数据完整性...');
      
      const tables = ['users', 'task_types', 'tasks', 'points_history', 'notifications'];
      const results = {};
      
      for (const table of tables) {
        // MySQL 记录数
        const [mysqlResult] = await this.mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const mysqlCount = mysqlResult[0].count;
        
        // PostgreSQL 记录数
        const postgresResult = await this.postgresPool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const postgresCount = parseInt(postgresResult.rows[0].count);
        
        results[table] = {
          mysql: mysqlCount,
          postgres: postgresCount,
          match: mysqlCount === postgresCount
        };
        
        const status = mysqlCount === postgresCount ? '✅' : '❌';
        console.log(`${status} ${table}: MySQL(${mysqlCount}) vs PostgreSQL(${postgresCount})`);
      }
      
      const allMatch = Object.values(results).every(r => r.match);
      
      if (allMatch) {
        console.log('🎉 数据完整性验证通过！');
      } else {
        console.log('⚠️  数据完整性验证发现差异');
      }
      
      return results;
    } catch (error) {
      console.error('❌ 数据完整性验证失败:', error);
      throw error;
    }
  }

  // 关闭连接
  async close() {
    try {
      if (this.mysqlConnection) {
        await this.mysqlConnection.end();
        console.log('🔌 MySQL 连接已关闭');
      }
      
      if (this.postgresPool) {
        await this.postgresPool.end();
        console.log('🔌 PostgreSQL 连接已关闭');
      }
    } catch (error) {
      console.error('❌ 关闭连接失败:', error);
    }
  }

  // 执行完整迁移
  async migrate() {
    try {
      console.log('🚀 开始数据迁移...');
      
      await this.initialize();
      const backupFile = await this.backupMySQLData();
      await this.importDataToPostgreSQL(backupFile);
      await this.verifyDataIntegrity();
      
      console.log('🎉 数据迁移完成！');
      
    } catch (error) {
      console.error('❌ 数据迁移失败:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const migrationHelper = new DataMigrationHelper();
  
  migrationHelper.migrate()
    .then(() => {
      console.log('✅ 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = DataMigrationHelper;
