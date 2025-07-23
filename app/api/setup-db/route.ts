import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 检查环境变量
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable not set'
      }, { status: 500 });
    }

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({
        success: false,
        error: 'JWT_SECRET environment variable not set'
      }, { status: 500 });
    }

    // 导入数据库模块
    const { query } = await import('@/lib/database');

    console.log('Setting up database tables...');

    // 创建users表的SQL
    const createUsersTableSQL = `
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
    `;

    // 执行创建表的SQL
    await query(createUsersTableSQL);
    console.log('Users table created successfully');

    // 检查是否需要创建默认管理员用户
    const adminCheck = await query('SELECT COUNT(*) as count FROM users WHERE username = $1', ['admin']);
    const adminExists = parseInt(adminCheck.rows[0]?.count || '0') > 0;

    if (!adminExists) {
      // 创建默认管理员用户 (密码: admin123)
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await query(`
        INSERT INTO users (username, email, password_hash, full_name, role, is_active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'admin',
        'admin@kdfamily.com',
        hashedPassword,
        '系统管理员',
        'advisor',
        true,
        true
      ]);
      
      console.log('Default admin user created');
    }

    // 验证表创建
    const tableCheck = await query(`
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);

    const userCount = await query('SELECT COUNT(*) as count FROM users');

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      details: {
        table_created: true,
        columns_count: tableCheck.rows.length,
        users_count: parseInt(userCount.rows[0]?.count || '0'),
        admin_created: !adminExists,
        columns: tableCheck.rows.map((row: any) => ({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
          default: row.column_default
        }))
      }
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Database setup endpoint',
    usage: 'Send a POST request to this endpoint to set up the database tables',
    warning: 'This will create tables and default users if they don\'t exist'
  });
}
