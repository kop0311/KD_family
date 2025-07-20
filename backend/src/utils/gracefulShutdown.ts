import { Server } from 'http'
import { closeDatabase } from '@/database/connection'
import { closeRedis } from '@/database/redis'
import { logger, logShutdown } from '@/utils/logger'

export const gracefulShutdown = (server: Server): void => {
  const shutdown = async (signal: string) => {
    logShutdown(`Received ${signal}, starting graceful shutdown...`)
    
    // Stop accepting new connections
    server.close(async () => {
      logShutdown('HTTP server closed')
      
      try {
        // Close database connections
        await closeDatabase()
        
        // Close Redis connection
        await closeRedis()
        
        logShutdown('All connections closed, exiting process')
        process.exit(0)
      } catch (error) {
        logger.error('Error during graceful shutdown:', error)
        process.exit(1)
      }
    })
    
    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Graceful shutdown timeout, forcing exit')
      process.exit(1)
    }, 30000)
  }
  
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}
