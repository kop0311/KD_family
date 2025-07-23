import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test basic response first
    console.log('Test DB endpoint called');
    
    // Check environment variables
    const dbUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable not set',
        env_check: {
          DATABASE_URL: !!dbUrl,
          JWT_SECRET: !!jwtSecret,
          NODE_ENV: process.env.NODE_ENV
        }
      }, { status: 500 });
    }

    // Try to import database module
    let dbModule;
    try {
      dbModule = await import('@/lib/database');
      console.log('Database module imported successfully');
    } catch (importError) {
      console.error('Database import error:', importError);
      return NextResponse.json({
        success: false,
        error: 'Failed to import database module',
        details: importError instanceof Error ? importError.message : 'Unknown import error'
      }, { status: 500 });
    }

    // Try to connect to database
    try {
      const { query } = dbModule;
      const result = await query('SELECT 1 as test');
      console.log('Database query successful:', result);
      
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        test_result: result.rows[0],
        env_check: {
          DATABASE_URL: !!dbUrl,
          JWT_SECRET: !!jwtSecret,
          NODE_ENV: process.env.NODE_ENV
        }
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        env_check: {
          DATABASE_URL: !!dbUrl,
          JWT_SECRET: !!jwtSecret,
          NODE_ENV: process.env.NODE_ENV
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test DB endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
