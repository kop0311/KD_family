import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface User {
  id: number
  username: string
  email: string
  role: string
  points: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  points: number
  assigned_to: number | null
  completed: boolean
  created_at: string
  updated_at: string
}

// 用户相关函数
export const userService = {
  async createUser(username: string, email: string, role: string = 'child') {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, email, role, points: 0 }])
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as User
  },

  async getUser(id: number) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(error.message)
    return data as User
  },

  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error) return null
    return data as User
  },

  async getLeaderboard() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('points', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data as User[]
  }
}

// 任务相关函数
export const taskService = {
  async createTask(title: string, description: string = '', points: number = 0) {
    if (!title.trim()) {
      throw new Error('Task title cannot be empty')
    }
    if (points < 0) {
      throw new Error('Task points cannot be negative')
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title, description, points }])
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as Task
  },

  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data as Task[]
  },

  async getTask(id: number) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(error.message)
    return data as Task
  },

  async assignTask(taskId: number, userId: number) {
    // 首先检查用户是否存在
    const user = await userService.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_to: userId })
      .eq('id', taskId)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data as Task
  },

  async completeTask(taskId: number) {
    // 使用事务来确保原子性操作
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()
    
    if (taskError) throw new Error(taskError.message)
    if (!task) throw new Error('Task not found')
    if (task.completed) throw new Error('Task is already completed')

    // 标记任务为完成
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ completed: true })
      .eq('id', taskId)
    
    if (updateError) throw new Error(updateError.message)

    // 如果任务有分配的用户，增加积分
    if (task.assigned_to) {
      const { error: pointsError } = await supabase.rpc('add_user_points', {
        user_id: task.assigned_to,
        points_to_add: task.points
      })
      
      if (pointsError) {
        // 如果积分更新失败，手动更新
        const { data: user } = await supabase
          .from('users')
          .select('points')
          .eq('id', task.assigned_to)
          .single()
        
        if (user) {
          await supabase
            .from('users')
            .update({ points: user.points + task.points })
            .eq('id', task.assigned_to)
        }
      }
    }

    return await this.getTask(taskId)
  }
}