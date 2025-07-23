import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '../../../../../lib/supabase'

// POST /api/tasks/[id]/assign - 分配任务给用户
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const taskId = parseInt(id, 10)
    const { userId } = await request.json()
    
    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      )
    }

    if (!userId || isNaN(parseInt(userId, 10))) {
      return NextResponse.json(
        { success: false, error: 'Valid user ID is required' },
        { status: 400 }
      )
    }

    const task = await taskService.assignTask(taskId, parseInt(userId, 10))
    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}