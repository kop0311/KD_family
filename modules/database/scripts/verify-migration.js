// 数据迁移验证脚本
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const crypto = require('crypto');

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

class MigrationVerifier {
  constructor() {
    this.mysqlConnection = null;
    this.postgresPool = null;
    this.results = {
      counts: {},
      samples: {},
      integrity: {},
      performance: {}
    };
  }

  async initialize() {
    try {
      console.log('🔗 初始化数据库连接...');
      
      this.mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);
      console.log('✅ MySQL 连接成功');
      
      this.postgresPool = new Pool(POSTGRES_CONFIG);
      await this.postgresPool.query('SELECT NOW()');
      console.log('✅ PostgreSQL 连接成功');
      
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  // 验证记录数量
  async verifyRecordCounts() {
    console.log('\n📊 验证记录数量...');
    
    const tables = ['users', 'task_types', 'tasks', 'points_history', 'notifications'];
    
    for (const table of tables) {
      try {
        // MySQL 记录数
        const [mysqlResult] = await this.mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const mysqlCount = mysqlResult[0].count;
        
        // PostgreSQL 记录数
        const postgresResult = await this.postgresPool.query(`SELECT COUNT(*) as count FROM ${table}`);
        const postgresCount = parseInt(postgresResult.rows[0].count);
        
        const match = mysqlCount === postgresCount;
        this.results.counts[table] = { mysql: mysqlCount, postgres: postgresCount, match };
        
        const status = match ? '✅' : '❌';
        console.log(`${status} ${table}: MySQL(${mysqlCount}) vs PostgreSQL(${postgresCount})`);
        
      } catch (error) {
        console.error(`❌ 验证表 ${table} 失败:`, error.message);
        this.results.counts[table] = { error: error.message };
      }
    }
  }

  // 验证数据样本
  async verifySampleData() {
    console.log('\n🔍 验证数据样本...');
    
    const sampleQueries = {
      users: {
        mysql: 'SELECT id, username, email, full_name, role, total_points FROM users ORDER BY id LIMIT 5',
        postgres: 'SELECT id, username, email, full_name, role, total_points FROM users ORDER BY id LIMIT 5'
      },
      tasks: {
        mysql: 'SELECT id, title, status, points, created_by, assigned_to FROM tasks ORDER BY id LIMIT 5',
        postgres: 'SELECT id, title, status, points, created_by, assigned_to FROM tasks ORDER BY id LIMIT 5'
      }
    };

    for (const [table, queries] of Object.entries(sampleQueries)) {
      try {
        console.log(`🔍 验证表 ${table} 的样本数据...`);
        
        // MySQL 样本
        const [mysqlRows] = await this.mysqlConnection.execute(queries.mysql);
        
        // PostgreSQL 样本
        const postgresResult = await this.postgresPool.query(queries.postgres);
        const postgresRows = postgresResult.rows;
        
        // 比较样本数据
        const matches = [];
        const minLength = Math.min(mysqlRows.length, postgresRows.length);
        
        for (let i = 0; i < minLength; i++) {
          const mysqlRow = mysqlRows[i];
          const postgresRow = postgresRows[i];
          
          const match = this.compareRows(mysqlRow, postgresRow);
          matches.push(match);
          
          if (!match.isMatch) {
            console.log(`❌ 行 ${i + 1} 不匹配:`, match.differences);
          }
        }
        
        const allMatch = matches.every(m => m.isMatch);
        this.results.samples[table] = { matches, allMatch };
        
        const status = allMatch ? '✅' : '❌';
        console.log(`${status} ${table} 样本数据验证${allMatch ? '通过' : '失败'}`);
        
      } catch (error) {
        console.error(`❌ 验证表 ${table} 样本数据失败:`, error.message);
        this.results.samples[table] = { error: error.message };
      }
    }
  }

  // 比较两行数据
  compareRows(mysqlRow, postgresRow) {
    const differences = [];
    const allKeys = new Set([...Object.keys(mysqlRow), ...Object.keys(postgresRow)]);
    
    for (const key of allKeys) {
      const mysqlValue = mysqlRow[key];
      const postgresValue = postgresRow[key];
      
      // 处理类型转换
      let normalizedMysqlValue = mysqlValue;
      let normalizedPostgresValue = postgresValue;
      
      // 处理日期
      if (mysqlValue instanceof Date && typeof postgresValue === 'string') {
        normalizedMysqlValue = mysqlValue.toISOString();
      } else if (typeof mysqlValue === 'string' && postgresValue instanceof Date) {
        normalizedPostgresValue = postgresValue.toISOString();
      }
      
      // 处理数字
      if (typeof mysqlValue === 'number' && typeof postgresValue === 'string') {
        normalizedPostgresValue = parseInt(postgresValue) || parseFloat(postgresValue);
      } else if (typeof mysqlValue === 'string' && typeof postgresValue === 'number') {
        normalizedMysqlValue = parseInt(mysqlValue) || parseFloat(mysqlValue);
      }
      
      if (normalizedMysqlValue !== normalizedPostgresValue) {
        differences.push({
          field: key,
          mysql: normalizedMysqlValue,
          postgres: normalizedPostgresValue
        });
      }
    }
    
    return {
      isMatch: differences.length === 0,
      differences
    };
  }

  // 验证数据完整性约束
  async verifyIntegrityConstraints() {
    console.log('\n🔒 验证数据完整性约束...');
    
    const integrityChecks = [
      {
        name: '用户邮箱唯一性',
        query: 'SELECT email, COUNT(*) as count FROM users GROUP BY email HAVING COUNT(*) > 1'
      },
      {
        name: '用户名唯一性',
        query: 'SELECT username, COUNT(*) as count FROM users GROUP BY username HAVING COUNT(*) > 1'
      },
      {
        name: '任务外键完整性',
        query: `
          SELECT COUNT(*) as count FROM tasks t 
          LEFT JOIN users u ON t.created_by = u.id 
          WHERE u.id IS NULL
        `
      },
      {
        name: '积分历史外键完整性',
        query: `
          SELECT COUNT(*) as count FROM points_history ph 
          LEFT JOIN users u ON ph.user_id = u.id 
          WHERE u.id IS NULL
        `
      }
    ];

    for (const check of integrityChecks) {
      try {
        console.log(`🔍 检查: ${check.name}`);
        
        const result = await this.postgresPool.query(check.query);
        const count = parseInt(result.rows[0]?.count || 0);
        
        const passed = count === 0;
        this.results.integrity[check.name] = { count, passed };
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${check.name}: ${passed ? '通过' : `发现 ${count} 个问题`}`);
        
      } catch (error) {
        console.error(`❌ 检查 ${check.name} 失败:`, error.message);
        this.results.integrity[check.name] = { error: error.message };
      }
    }
  }

  // 性能测试
  async performanceTest() {
    console.log('\n⚡ 执行性能测试...');
    
    const testQueries = [
      {
        name: '用户查询',
        query: 'SELECT * FROM users WHERE role = $1 ORDER BY total_points DESC LIMIT 10',
        params: ['member']
      },
      {
        name: '任务查询',
        query: 'SELECT * FROM tasks WHERE status = $1 ORDER BY created_at DESC LIMIT 20',
        params: ['pending']
      },
      {
        name: '积分统计',
        query: `
          SELECT u.username, SUM(ph.points_change) as total_points
          FROM users u
          LEFT JOIN points_history ph ON u.id = ph.user_id
          GROUP BY u.id, u.username
          ORDER BY total_points DESC
          LIMIT 10
        `,
        params: []
      }
    ];

    for (const test of testQueries) {
      try {
        console.log(`⚡ 测试: ${test.name}`);
        
        const startTime = Date.now();
        await this.postgresPool.query(test.query, test.params);
        const endTime = Date.now();
        
        const duration = endTime - startTime;
        this.results.performance[test.name] = { duration };
        
        console.log(`✅ ${test.name}: ${duration}ms`);
        
      } catch (error) {
        console.error(`❌ 性能测试 ${test.name} 失败:`, error.message);
        this.results.performance[test.name] = { error: error.message };
      }
    }
  }

  // 生成验证报告
  generateReport() {
    console.log('\n📋 生成验证报告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTables: Object.keys(this.results.counts).length,
        tablesMatched: Object.values(this.results.counts).filter(r => r.match).length,
        integrityChecksPassed: Object.values(this.results.integrity).filter(r => r.passed).length,
        totalIntegrityChecks: Object.keys(this.results.integrity).length
      },
      details: this.results
    };
    
    console.log('\n📊 验证摘要:');
    console.log(`- 表数量匹配: ${report.summary.tablesMatched}/${report.summary.totalTables}`);
    console.log(`- 完整性检查通过: ${report.summary.integrityChecksPassed}/${report.summary.totalIntegrityChecks}`);
    
    // 保存报告
    const fs = require('fs').promises;
    const reportFile = `./migration_backup/verification_report_${Date.now()}.json`;
    
    return fs.writeFile(reportFile, JSON.stringify(report, null, 2))
      .then(() => {
        console.log(`📄 验证报告已保存: ${reportFile}`);
        return report;
      })
      .catch(error => {
        console.error('❌ 保存报告失败:', error);
        return report;
      });
  }

  async close() {
    try {
      if (this.mysqlConnection) {
        await this.mysqlConnection.end();
      }
      if (this.postgresPool) {
        await this.postgresPool.end();
      }
    } catch (error) {
      console.error('❌ 关闭连接失败:', error);
    }
  }

  // 执行完整验证
  async verify() {
    try {
      console.log('🔍 开始数据迁移验证...');
      
      await this.initialize();
      await this.verifyRecordCounts();
      await this.verifySampleData();
      await this.verifyIntegrityConstraints();
      await this.performanceTest();
      
      const report = await this.generateReport();
      
      console.log('\n🎉 数据迁移验证完成！');
      return report;
      
    } catch (error) {
      console.error('❌ 数据迁移验证失败:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const verifier = new MigrationVerifier();
  
  verifier.verify()
    .then((report) => {
      const success = report.summary.tablesMatched === report.summary.totalTables &&
                     report.summary.integrityChecksPassed === report.summary.totalIntegrityChecks;
      
      console.log(success ? '✅ 验证全部通过' : '⚠️  验证发现问题');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ 验证脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = MigrationVerifier;
