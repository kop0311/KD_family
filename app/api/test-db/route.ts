import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: {},
    database: {},
    dependencies: {},
    tables: {},
    issues: [],
    fixes: []
  };

  try {
    console.log('Enhanced test DB endpoint called');

    // Check environment variables
    const dbUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET;

    debug.environment = {
      DATABASE_URL: !!dbUrl,
      JWT_SECRET: !!jwtSecret,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_LENGTH: dbUrl?.length || 0,
      JWT_SECRET_LENGTH: jwtSecret?.length || 0
    };

    if (!dbUrl) {
      debug.issues.push('❌ DATABASE_URL environment variable not set');
      debug.fixes.push('Set DATABASE_URL in Vercel environment variables');
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable not set',
        debug
      }, { status: 500 });
    }

    if (!jwtSecret) {
      debug.issues.push('❌ JWT_SECRET environment variable not set');
      debug.fixes.push('Set JWT_SECRET in Vercel environment variables');
    }

    // Check dependencies
    try {
      await import('bcryptjs');
      debug.dependencies.bcryptjs = '✅ Available';
    } catch (e) {
      debug.dependencies.bcryptjs = `❌ Error: ${e instanceof Error ? e.message : 'Unknown'}`;
      debug.issues.push('❌ bcryptjs dependency failed to load');
      debug.fixes.push('Check bcryptjs installation: npm install bcryptjs');
    }

    try {
      await import('jsonwebtoken');
      debug.dependencies.jsonwebtoken = '✅ Available';
    } catch (e) {
      debug.dependencies.jsonwebtoken = `❌ Error: ${e instanceof Error ? e.message : 'Unknown'}`;
      debug.issues.push('❌ jsonwebtoken dependency failed to load');
      debug.fixes.push('Check jsonwebtoken installation: npm install jsonwebtoken');
    }

    // Try to import database module
    let dbModule;
    try {
      dbModule = await import('@/lib/database');
      debug.dependencies.database = '✅ Available';
      console.log('Database module imported successfully');
    } catch (importError) {
      debug.dependencies.database = `❌ Error: ${importError instanceof Error ? importError.message : 'Unknown'}`;
      debug.issues.push('❌ Database module failed to import');
      debug.fixes.push('Check database configuration and lib/database.ts file');
      console.error('Database import error:', importError);
      return NextResponse.json({
        success: false,
        error: 'Failed to import database module',
        debug
      }, { status: 500 });
    }

    // Try to connect to database
    try {
      const { query } = dbModule;
      const result = await query('SELECT NOW() as current_time, version() as pg_version');
      debug.database.connection = '✅ Connected';
      debug.database.server_time = result.rows[0]?.current_time;
      debug.database.postgresql_version = result.rows[0]?.pg_version?.split(' ')[0];
      console.log('Database query successful:', result);

      // Check if users table exists
      try {
        const tableCheck = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'users'
          ) as table_exists
        `);

        debug.tables.users_exists = tableCheck.rows[0]?.table_exists || false;

        if (debug.tables.users_exists) {
          // Check user count
          const userCount = await query('SELECT COUNT(*) as count FROM users');
          debug.tables.users_count = parseInt(userCount.rows[0]?.count || '0');
        } else {
          debug.issues.push('❌ Users table does not exist');
          debug.fixes.push('Run database setup: POST /api/setup-db');
        }
      } catch (tableError) {
        debug.tables.error = tableError instanceof Error ? tableError.message : 'Unknown table error';
        debug.issues.push('❌ Failed to check users table');
        debug.fixes.push('Check database permissions and table structure');
      }

    } catch (dbError) {
      debug.database.connection = `❌ Error: ${dbError instanceof Error ? dbError.message : 'Unknown'}`;
      debug.issues.push('❌ Database connection failed');
      debug.fixes.push('Check DATABASE_URL format and database server status');
      console.error('Database query error:', dbError);
    }

    // Generate final response
    const success = debug.issues.length === 0;

    return NextResponse.json({
      success,
      message: success ? 'All checks passed! Registration should work.' : 'Issues found that need to be fixed',
      debug,
      issues: debug.issues,
      fixes: debug.fixes,
      next_steps: success ? [
        'All checks passed! Registration should work.',
        'Try registering a new user at /login',
        'Check Vercel function logs if issues persist.'
      ] : [
        'Fix the issues listed above.',
        'Redeploy the application if needed.',
        'Run this test endpoint again to verify fixes.'
      ]
    }, { status: success ? 200 : 500 });

  } catch (error) {
    console.error('Test DB endpoint error:', error);
    debug.issues.push(`❌ Endpoint error: ${error instanceof Error ? error.message : 'Unknown'}`);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      debug,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
