import { Router } from 'express'
import { authenticate } from '@/middleware/auth'
import { asyncHandler } from '@/middleware/errorHandler'

const router = Router()

// Get user profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
    message: 'Profile retrieved successfully',
  })
}))

export default router
