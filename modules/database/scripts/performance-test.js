// PostgreSQL 性能测试脚本
const { Pool } = require('pg');
const { performance } = require('perf_hooks');

// 配置
const POSTGRES_CONFIG = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5433,
  user: process.env.POSTGRES_USER || 'kdfamily_user',
  password: process.env.POSTGRES_PASSWORD || 'kdfamily_pass',
  database: process.env.POSTGRES_DATABASE || 'kdfamily'
};

class PerformanceTester {
  constructor() {
    this.pool = null;
    this.results = {};
  }

  async initialize() {
    console.log('🔗 初始化数据库连接...');
    this.pool = new Pool(POSTGRES_CONFIG);
    
    // 测试连接
    await this.pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL 连接成功');
  }

  // 执行性能测试
  async runTest(name, testFunction, iterations = 1) {
    console.log(`⚡ 执行测试: ${name} (${iterations} 次)`);
    
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      try {
        await testFunction();
        const endTime = performance.now();
        times.push(endTime - startTime);
      } catch (error) {
        console.error(`❌ 测试 ${name} 第 ${i + 1} 次失败:`, error.message);
        times.push(null);
      }
    }
    
    const validTimes = times.filter(t => t !== null);
    
    if (validTimes.length === 0) {
      this.results[name] = { error: '所有测试都失败了' };
      return;
    }
    
    const avgTime = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
    const minTime = Math.min(...validTimes);
    const maxTime = Math.max(...validTimes);
    
    this.results[name] = {
      iterations: validTimes.length,
      avgTime: Math.round(avgTime * 100) / 100,
      minTime: Math.round(minTime * 100) / 100,
      maxTime: Math.round(maxTime * 100) / 100,
      successRate: (validTimes.length / iterations) * 100
    };
    
    console.log(`✅ ${name}: 平均 ${this.results[name].avgTime}ms`);
  }

  // 基础查询测试
  async basicQueryTests() {
    console.log('\n📊 基础查询测试...');
    
    await this.runTest('简单SELECT查询', async () => {
      await this.pool.query('SELECT COUNT(*) FROM users');
    }, 100);
    
    await this.runTest('带WHERE条件查询', async () => {
      await this.pool.query('SELECT * FROM users WHERE role = $1 LIMIT 10', ['member']);
    }, 50);
    
    await this.runTest('JOIN查询', async () => {
      await this.pool.query(`
        SELECT u.username, COUNT(t.id) as task_count
        FROM users u
        LEFT JOIN tasks t ON u.id = t.assigned_to
        GROUP BY u.id, u.username
        LIMIT 10
      `);
    }, 30);
    
    await this.runTest('复杂聚合查询', async () => {
      await this.pool.query(`
        SELECT 
          u.username,
          u.total_points,
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
          COALESCE(SUM(CASE WHEN t.status = 'approved' THEN t.points END), 0) as earned_points
        FROM users u
        LEFT JOIN tasks t ON u.id = t.assigned_to
        GROUP BY u.id, u.username, u.total_points
        ORDER BY u.total_points DESC
        LIMIT 20
      `);
    }, 20);
  }

  // 索引性能测试
  async indexPerformanceTests() {
    console.log('\n🔍 索引性能测试...');
    
    await this.runTest('主键查询', async () => {
      await this.pool.query('SELECT * FROM users WHERE id = $1', [1]);
    }, 100);
    
    await this.runTest('唯一索引查询', async () => {
      await this.pool.query('SELECT * FROM users WHERE email = $1', ['admin@kdfamily.com']);
    }, 100);
    
    await this.runTest('普通索引查询', async () => {
      await this.pool.query('SELECT * FROM tasks WHERE status = $1', ['pending']);
    }, 50);
    
    await this.runTest('复合索引查询', async () => {
      await this.pool.query('SELECT * FROM tasks WHERE status = $1 AND assigned_to = $2', ['in_progress', 1]);
    }, 50);
    
    await this.runTest('全文搜索', async () => {
      await this.pool.query(`
        SELECT * FROM tasks 
        WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', $1)
        LIMIT 10
      `, ['test']);
    }, 30);
  }

  // 写入性能测试
  async writePerformanceTests() {
    console.log('\n✏️  写入性能测试...');
    
    await this.runTest('单条INSERT', async () => {
      const result = await this.pool.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [1, '性能测试通知', '这是一个性能测试通知', 'system']);
      
      // 清理测试数据
      await this.pool.query('DELETE FROM notifications WHERE id = $1', [result.rows[0].id]);
    }, 50);
    
    await this.runTest('批量INSERT', async () => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        
        for (let i = 0; i < 10; i++) {
          await client.query(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES ($1, $2, $3, $4)
          `, [1, `批量测试通知 ${i}`, `这是第 ${i} 个批量测试通知`, 'system']);
        }
        
        await client.query('ROLLBACK'); // 回滚以清理数据
      } finally {
        client.release();
      }
    }, 20);
    
    await this.runTest('UPDATE操作', async () => {
      // 先插入测试数据
      const insertResult = await this.pool.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [1, '更新测试', '待更新的通知', 'system']);
      
      const notificationId = insertResult.rows[0].id;
      
      // 执行更新
      await this.pool.query(`
        UPDATE notifications 
        SET message = $1, is_read = $2
        WHERE id = $3
      `, ['已更新的通知', true, notificationId]);
      
      // 清理测试数据
      await this.pool.query('DELETE FROM notifications WHERE id = $1', [notificationId]);
    }, 30);
  }

  // 并发测试
  async concurrencyTests() {
    console.log('\n🔄 并发测试...');
    
    await this.runTest('并发读取', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(this.pool.query('SELECT COUNT(*) FROM users'));
      }
      await Promise.all(promises);
    }, 20);
    
    await this.runTest('并发写入', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          this.pool.query(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `, [1, `并发测试 ${i}`, `并发写入测试 ${i}`, 'system'])
          .then(result => {
            // 立即删除以清理数据
            return this.pool.query('DELETE FROM notifications WHERE id = $1', [result.rows[0].id]);
          })
        );
      }
      await Promise.all(promises);
    }, 10);
  }

  // 连接池测试
  async connectionPoolTests() {
    console.log('\n🏊 连接池测试...');
    
    await this.runTest('连接池压力测试', async () => {
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          this.pool.query('SELECT pg_sleep(0.1), $1 as test_id', [i])
        );
      }
      await Promise.all(promises);
    }, 5);
    
    // 测试连接池状态
    console.log('📊 连接池状态:');
    console.log(`- 总连接数: ${this.pool.totalCount}`);
    console.log(`- 空闲连接数: ${this.pool.idleCount}`);
    console.log(`- 等待连接数: ${this.pool.waitingCount}`);
  }

  // 生成性能报告
  generateReport() {
    console.log('\n📋 性能测试报告');
    console.log('=' * 50);
    
    const categories = {
      '基础查询': ['简单SELECT查询', '带WHERE条件查询', 'JOIN查询', '复杂聚合查询'],
      '索引性能': ['主键查询', '唯一索引查询', '普通索引查询', '复合索引查询', '全文搜索'],
      '写入性能': ['单条INSERT', '批量INSERT', 'UPDATE操作'],
      '并发性能': ['并发读取', '并发写入'],
      '连接池': ['连接池压力测试']
    };
    
    for (const [category, tests] of Object.entries(categories)) {
      console.log(`\n📊 ${category}:`);
      
      for (const testName of tests) {
        const result = this.results[testName];
        if (result) {
          if (result.error) {
            console.log(`  ❌ ${testName}: ${result.error}`);
          } else {
            const status = result.avgTime < 100 ? '🟢' : result.avgTime < 500 ? '🟡' : '🔴';
            console.log(`  ${status} ${testName}: ${result.avgTime}ms (${result.minTime}-${result.maxTime}ms, ${result.successRate}%)`);
          }
        }
      }
    }
    
    // 性能建议
    console.log('\n💡 性能建议:');
    
    const slowTests = Object.entries(this.results)
      .filter(([_, result]) => result.avgTime && result.avgTime > 500)
      .sort((a, b) => b[1].avgTime - a[1].avgTime);
    
    if (slowTests.length > 0) {
      console.log('⚠️  以下查询较慢，建议优化:');
      slowTests.forEach(([testName, result]) => {
        console.log(`  - ${testName}: ${result.avgTime}ms`);
      });
    } else {
      console.log('✅ 所有测试性能良好！');
    }
    
    // 保存报告
    const fs = require('fs').promises;
    const reportData = {
      timestamp: new Date().toISOString(),
      config: POSTGRES_CONFIG,
      results: this.results
    };
    
    return fs.writeFile(
      `./migration_backup/performance_report_${Date.now()}.json`,
      JSON.stringify(reportData, null, 2)
    ).then(() => {
      console.log('\n📄 性能报告已保存到 migration_backup 目录');
    }).catch(error => {
      console.error('❌ 保存报告失败:', error);
    });
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 数据库连接已关闭');
    }
  }

  // 执行所有测试
  async runAllTests() {
    try {
      console.log('🚀 开始 PostgreSQL 性能测试...');
      
      await this.initialize();
      await this.basicQueryTests();
      await this.indexPerformanceTests();
      await this.writePerformanceTests();
      await this.concurrencyTests();
      await this.connectionPoolTests();
      await this.generateReport();
      
      console.log('\n🎉 性能测试完成！');
      
    } catch (error) {
      console.error('❌ 性能测试失败:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new PerformanceTester();
  
  tester.runAllTests()
    .then(() => {
      console.log('✅ 性能测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 性能测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTester;
