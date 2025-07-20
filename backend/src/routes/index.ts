import { Application } from 'express'
import authRoutes from './auth'
import userRoutes from './users'
import taskRoutes from './tasks'
import { addRequestId } from '@/middleware/auth'

export const setupRoutes = (app: Application): void => {
  // Add request ID to all requests
  app.use(addRequestId)
  
  // API routes
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/tasks', taskRoutes)
}
