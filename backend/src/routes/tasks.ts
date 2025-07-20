import { Router } from 'express'
import { authenticate } from '@/middleware/auth'
import { asyncHandler } from '@/middleware/errorHandler'

const router = Router()

// Get tasks
router.get('/', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { tasks: [] },
    message: 'Tasks retrieved successfully',
  })
}))

export default router
