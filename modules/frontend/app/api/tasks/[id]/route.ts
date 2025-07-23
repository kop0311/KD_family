import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '../../../../lib/supabase'

// GET /api/tasks/[id] - 获取单个任务信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id, 10)
    
    if (isNaN(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      )
    }

    const task = await taskService.getTask(taskId)
    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}