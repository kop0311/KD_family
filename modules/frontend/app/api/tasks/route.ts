import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '../../../lib/supabase'

// GET /api/tasks - 获取所有任务
export async function GET() {
  try {
    const tasks = await taskService.getTasks()
    return NextResponse.json({ success: true, data: tasks })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - 创建新任务
export async function POST(request: NextRequest) {
  try {
    const { title, description, points } = await request.json()

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Task title cannot be empty' },
        { status: 400 }
      )
    }

    if (typeof points === 'number' && points < 0) {
      return NextResponse.json(
        { success: false, error: 'Task points cannot be negative' },
        { status: 400 }
      )
    }

    const task = await taskService.createTask(
      title,
      description || '',
      points || 0
    )
    
    return NextResponse.json({ success: true, data: task }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}