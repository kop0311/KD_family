import { NextRequest, NextResponse } from 'next/server';

// Dynamic imports to handle potential module issues
async function importDependencies() {
  try {
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');
    const database = await import('@/lib/database');
    return { bcrypt, jwt, database };
  } catch (error) {
    console.error('Failed to import dependencies:', error);
    throw error;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  console.log('Registration endpoint called');

  try {
    // Check environment variables first
    const JWT_SECRET = process.env.JWT_SECRET;
    const DATABASE_URL = process.env.DATABASE_URL;

    if (!JWT_SECRET) {
      console.error('JWT_SECRET not set');
      return NextResponse.json({
        success: false,
        message: 'Server configuration error: JWT_SECRET not set'
      }, { status: 500 });
    }

    if (!DATABASE_URL) {
      console.error('DATABASE_URL not set');
      return NextResponse.json({
        success: false,
        message: 'Server configuration error: DATABASE_URL not set'
      }, { status: 500 });
    }

    // Import dependencies
    let bcrypt, jwt, database;
    try {
      const deps = await importDependencies();
      bcrypt = deps.bcrypt;
      jwt = deps.jwt;
      database = deps.database;
      console.log('Dependencies imported successfully');
    } catch (importError) {
      console.error('Dependency import error:', importError);
      return NextResponse.json({
        success: false,
        message: 'Server error: Failed to load required modules',
        details: importError instanceof Error ? importError.message : 'Unknown import error'
      }, { status: 500 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed:', { ...body, password: '[REDACTED]' });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({
        success: false,
        message: 'Invalid JSON in request body'
      }, { status: 400 });
    }

    const { username, email, password, fullName, role = 'member' } = body;

    // Validation
    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户名、邮箱、密码和姓名都是必填项' 
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          message: '请输入有效的邮箱地址' 
        },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          message: '密码长度至少为6位' 
        },
        { status: 400 }
      );
    }

    // Role validation
    const validRoles = ['advisor', 'parent', 'member'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { 
          success: false, 
          message: '无效的用户角色' 
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    let existingUser;
    try {
      const existingUserQuery = `
        SELECT id FROM users
        WHERE username = $1 OR email = $2
      `;
      console.log('Checking for existing user...');
      existingUser = await database.query(existingUserQuery, [username, email]);
      console.log('Existing user check completed');
    } catch (dbError) {
      console.error('Database error during user check:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Database error: Unable to check existing users',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户名或邮箱已存在' 
        },
        { status: 409 }
      );
    }

    // Hash password
    let hashedPassword;
    try {
      const saltRounds = 12;
      console.log('Hashing password...');
      hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('Password hashed successfully');
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return NextResponse.json({
        success: false,
        message: 'Server error: Password processing failed'
      }, { status: 500 });
    }

    // Create user
    let newUser;
    try {
      const insertUserQuery = `
        INSERT INTO users (username, email, password_hash, full_name, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, username, email, full_name, role, created_at
      `;

      console.log('Creating new user...');
      newUser = await database.query(insertUserQuery, [
        username,
        email,
        hashedPassword,
        fullName,
        role
      ]);
      console.log('User created successfully');
    } catch (insertError) {
      console.error('User creation error:', insertError);
      return NextResponse.json({
        success: false,
        message: 'Database error: Failed to create user',
        details: insertError instanceof Error ? insertError.message : 'Unknown database error'
      }, { status: 500 });
    }

    if (newUser.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户创建失败' 
        },
        { status: 500 }
      );
    }

    const user = newUser.rows[0];

    // Generate JWT token
    let token;
    try {
      console.log('Generating JWT token...');
      token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('JWT token generated successfully');
    } catch (jwtError) {
      console.error('JWT generation error:', jwtError);
      return NextResponse.json({
        success: false,
        message: 'Server error: Token generation failed'
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        avatarUrl: null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}
