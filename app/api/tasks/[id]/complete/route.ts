import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '../../../../../lib/supabase'

// POST /api/tasks/[id]/complete - 完成任务
export async function POST(
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

    const task = await taskService.completeTask(taskId)
    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    if (errorMessage.includes('already completed')) {
      return NextResponse.json(
        { success: false, error: 'Task is already completed' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}