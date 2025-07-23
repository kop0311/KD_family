import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户名和密码都是必填项' 
        },
        { status: 400 }
      );
    }

    // Find user by username or email
    const userQuery = `
      SELECT id, username, email, password_hash, full_name, role, avatar_url
      FROM users 
      WHERE username = $1 OR email = $1
    `;
    const userResult = await query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户名或密码错误' 
        },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户名或密码错误' 
        },
        { status: 401 }
      );
    }

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

    // Update last login time
    await query(
      'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}
