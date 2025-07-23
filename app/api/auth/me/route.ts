import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          message: '未提供认证令牌' 
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          message: '无效的认证令牌' 
        },
        { status: 401 }
      );
    }

    // Get user from database
    const userQuery = `
      SELECT id, username, email, full_name, role, avatar_url, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    const userResult = await query(userQuery, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: '用户不存在' 
        },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Return user info
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
        group_id: null // Will be implemented later if needed
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}
