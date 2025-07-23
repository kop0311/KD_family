import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Even if no token, logout is successful (client-side cleanup)
      return NextResponse.json({
        success: true,
        message: '登出成功'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token to get user info
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      // Token is invalid, but logout is still successful
      return NextResponse.json({
        success: true,
        message: '登出成功'
      });
    }

    // Update user's last logout time (optional)
    try {
      await query(
        'UPDATE users SET last_logout = NOW(), updated_at = NOW() WHERE id = $1',
        [decoded.userId]
      );
    } catch (error) {
      console.error('Failed to update logout time:', error);
      // Don't fail the logout if this fails
    }

    // In a more sophisticated system, you might want to:
    // 1. Add the token to a blacklist
    // 2. Store active sessions in database
    // 3. Invalidate refresh tokens
    // For now, we rely on client-side token removal

    return NextResponse.json({
      success: true,
      message: '登出成功'
    });

  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, logout should succeed
    return NextResponse.json({
      success: true,
      message: '登出成功'
    });
  }
}
