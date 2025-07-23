import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    const existingUserQuery = `
      SELECT id FROM users 
      WHERE username = $1 OR email = $2
    `;
    const existingUser = await query(existingUserQuery, [username, email]);

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
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const insertUserQuery = `
      INSERT INTO users (username, email, password_hash, full_name, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, username, email, full_name, role, created_at
    `;
    
    const newUser = await query(insertUserQuery, [
      username,
      email,
      hashedPassword,
      fullName,
      role
    ]);

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
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
