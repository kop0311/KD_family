import { PrismaClient } from '@prisma/client'
import { logger } from '@/utils/logger'
import { isDevelopment } from '@/config/environment'

// Extend PrismaClient with custom methods
class ExtendedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: isDevelopment 
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
      errorFormat: 'pretty',
    })

    // Add query logging middleware
    this.$use(async (params, next) => {
      const start = Date.now()
      const result = await next(params)
      const end = Date.now()
      
      logger.debug('Prisma Query', {
        model: params.model,
        action: params.action,
        duration: `${end - start}ms`,
      })
      
      return result
    })

    // Add error handling middleware
    this.$use(async (params, next) => {
      try {
        return await next(params)
      } catch (error) {
        logger.error('Prisma Error', {
          model: params.model,
          action: params.action,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    })
  }

  // Custom method to get user with stats
  async getUserWithStats(userId: number) {
    return this.user.findUnique({
      where: { id: userId },
      include: {
        group: true,
        _count: {
          select: {
            createdTasks: true,
            assignedTasks: true,
            achievements: true,
            points: true,
          },
        },
      },
    })
  }

  // Custom method to get leaderboard
  async getLeaderboard(groupId?: number, limit = 10) {
    const where = groupId ? { user: { groupId } } : {}
    
    return this.userStats.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: {
        totalPoints: 'desc',
      },
      take: limit,
    })
  }

  // Custom method to get task statistics
  async getTaskStats(userId?: number, groupId?: number) {
    const where: any = {}
    if (userId) where.assignedTo = userId
    if (groupId) where.groupId = groupId

    const [total, completed, pending, overdue] = await Promise.all([
      this.task.count({ where }),
      this.task.count({ where: { ...where, status: 'COMPLETED' } }),
      this.task.count({ where: { ...where, status: { in: ['AVAILABLE', 'CLAIMED'] } } }),
      this.task.count({
        where: {
          ...where,
          status: { in: ['AVAILABLE', 'CLAIMED'] },
          dueDate: { lt: new Date() },
        },
      }),
    ])

    return { total, completed, pending, overdue }
  }

  // Custom method to update user statistics
  async updateUserStats(userId: number) {
    const [points, tasks, achievements] = await Promise.all([
      this.point.aggregate({
        where: { userId },
        _sum: { points: true },
      }),
      this.task.count({
        where: { assignedTo: userId, status: 'COMPLETED' },
      }),
      this.userAchievement.count({
        where: { userId },
      }),
    ])

    // Calculate week and month points
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    const [weekPoints, monthPoints, yearPoints] = await Promise.all([
      this.point.aggregate({
        where: {
          userId,
          createdAt: { gte: weekStart },
        },
        _sum: { points: true },
      }),
      this.point.aggregate({
        where: {
          userId,
          createdAt: { gte: monthStart },
        },
        _sum: { points: true },
      }),
      this.point.aggregate({
        where: {
          userId,
          createdAt: { gte: yearStart },
        },
        _sum: { points: true },
      }),
    ])

    // Calculate streak (simplified - you might want a more complex calculation)
    const recentTasks = await this.task.findMany({
      where: {
        assignedTo: userId,
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      take: 30,
    })

    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0
    
    // Simple streak calculation (consecutive days with completed tasks)
    const completedDates = recentTasks.map(task => 
      task.completedAt!.toDateString()
    )
    
    const uniqueDates = [...new Set(completedDates)].sort().reverse()
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i])
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)
      
      if (currentDate.toDateString() === expectedDate.toDateString()) {
        tempStreak++
        if (i === 0) currentStreak = tempStreak
      } else {
        bestStreak = Math.max(bestStreak, tempStreak)
        tempStreak = 0
        break
      }
    }
    
    bestStreak = Math.max(bestStreak, tempStreak, currentStreak)

    // Update or create user stats
    return this.userStats.upsert({
      where: { userId },
      update: {
        totalPoints: points._sum.points || 0,
        weekPoints: weekPoints._sum.points || 0,
        monthPoints: monthPoints._sum.points || 0,
        yearPoints: yearPoints._sum.points || 0,
        completedTasks: tasks,
        currentStreak,
        bestStreak,
        lastActivity: new Date(),
      },
      create: {
        userId,
        totalPoints: points._sum.points || 0,
        weekPoints: weekPoints._sum.points || 0,
        monthPoints: monthPoints._sum.points || 0,
        yearPoints: yearPoints._sum.points || 0,
        totalTasks: tasks,
        completedTasks: tasks,
        currentStreak,
        bestStreak,
        lastActivity: new Date(),
      },
    })
  }

  // Health check method
  async healthCheck() {
    try {
      await this.$queryRaw`SELECT 1`
      return { status: 'healthy', timestamp: new Date() }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date() 
      }
    }
  }
}

// Create singleton instance
const prisma = new ExtendedPrismaClient()

// Handle graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Disconnecting Prisma client...')
  await prisma.$disconnect()
}

process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)
process.on('beforeExit', gracefulShutdown)

export { prisma }
export default prisma
