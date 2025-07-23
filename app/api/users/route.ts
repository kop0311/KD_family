import { NextRequest, NextResponse } from 'next/server'
import { userService } from '../../../lib/supabase'

// GET /api/users - 获取排行榜
export async function GET() {
  try {
    const users = await userService.getLeaderboard()
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/users - 创建新用户
export async function POST(request: NextRequest) {
  try {
    const { username, email, role } = await request.json()

    if (!username || !email) {
      return NextResponse.json(
        { success: false, error: 'Username and email are required' },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const user = await userService.createUser(username, email, role)
    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // 处理重复用户名或邮箱的错误
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return NextResponse.json(
        { success: false, error: 'Username or email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}