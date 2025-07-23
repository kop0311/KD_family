import { NextResponse } from 'next/server'
import { userService } from '../../../lib/supabase'

// GET /api/leaderboard - 获取排行榜
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