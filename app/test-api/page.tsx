'use client'

import { useState, useEffect } from 'react'
import { userAPI, taskAPI } from '../../services/api'

export default function TestAPI() {
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [newUser, setNewUser] = useState({ username: '', email: '', role: 'child' })
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    taskType: 'PM' as const,
    points: 0
  })
  const [message, setMessage] = useState('')

  // 测试获取用户
  const testGetUsers = async () => {
    try {
      const response = await userAPI.getUsers()
      if (response.data.success) {
        setUsers(response.data.data)
        setMessage('用户数据加载成功')
      }
    } catch (error) {
      setMessage(`获取用户失败: ${error}`)
    }
  }

  // 测试获取任务
  const testGetTasks = async () => {
    try {
      const response = await taskAPI.getTasks()
      if (response.data.success) {
        setTasks(response.data.data)
        setMessage('任务数据加载成功')
      }
    } catch (error) {
      setMessage(`获取任务失败: ${error}`)
    }
  }

  // 测试创建用户
  const testCreateUser = async () => {
    try {
      const response = await userAPI.createUser(newUser)
      if (response.data.success) {
        setMessage(`用户创建成功: ${response.data.data.username}`)
        setNewUser({ username: '', email: '', role: 'child' })
        testGetUsers() // 重新加载用户列表
      }
    } catch (error) {
      setMessage(`创建用户失败: ${error}`)
    }
  }

  // 测试创建任务
  const testCreateTask = async () => {
    try {
      const response = await taskAPI.createTask(newTask)
      if (response.data.success) {
        setMessage(`任务创建成功: ${response.data.data.title}`)
        setNewTask({ title: '', description: '', taskType: 'PM' as const, points: 0 })
        testGetTasks() // 重新加载任务列表
      }
    } catch (error) {
      setMessage(`创建任务失败: ${error}`)
    }
  }

  useEffect(() => {
    testGetUsers()
    testGetTasks()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">API 测试页面</h1>
      
      {message && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 rounded">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 用户部分 */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">用户管理</h2>
          
          {/* 创建用户表单 */}
          <div className="mb-4 p-4 border rounded">
            <h3 className="font-medium mb-2">创建新用户</h3>
            <input
              type="text"
              placeholder="用户名"
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              className="block w-full mb-2 p-2 border rounded"
            />
            <input
              type="email"
              placeholder="邮箱"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              className="block w-full mb-2 p-2 border rounded"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="block w-full mb-2 p-2 border rounded"
            >
              <option value="child">Child</option>
              <option value="parent">Parent</option>
            </select>
            <button
              onClick={testCreateUser}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              创建用户
            </button>
          </div>

          {/* 用户列表 */}
          <div>
            <h3 className="font-medium mb-2">用户列表 ({users.length})</h3>
            <div className="space-y-2">
              {users.map((user: any) => (
                <div key={user.id} className="p-2 border rounded">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-sm">角色: {user.role} | 积分: {user.points}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 任务部分 */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">任务管理</h2>
          
          {/* 创建任务表单 */}
          <div className="mb-4 p-4 border rounded">
            <h3 className="font-medium mb-2">创建新任务</h3>
            <input
              type="text"
              placeholder="任务标题"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              className="block w-full mb-2 p-2 border rounded"
            />
            <textarea
              placeholder="任务描述"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              className="block w-full mb-2 p-2 border rounded"
            />
            <input
              type="number"
              placeholder="积分"
              value={newTask.points}
              onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
              className="block w-full mb-2 p-2 border rounded"
            />
            <button
              onClick={testCreateTask}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              创建任务
            </button>
          </div>

          {/* 任务列表 */}
          <div>
            <h3 className="font-medium mb-2">任务列表 ({tasks.length})</h3>
            <div className="space-y-2">
              {tasks.map((task: any) => (
                <div key={task.id} className="p-2 border rounded">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-gray-600">{task.description}</div>
                  <div className="text-sm">
                    积分: {task.points} | 
                    状态: {task.completed ? '已完成' : '未完成'} |
                    分配给: {task.assigned_to || '未分配'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={testGetUsers}
          className="mr-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          刷新用户
        </button>
        <button
          onClick={testGetTasks}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          刷新任务
        </button>
      </div>
    </div>
  )
}