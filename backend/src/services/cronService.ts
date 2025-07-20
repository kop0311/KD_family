import cron from 'node-cron'
import { logger } from '@/utils/logger'

export const startCronJobs = (): void => {
  // Example: Daily cleanup job
  cron.schedule('0 2 * * *', () => {
    logger.info('Running daily cleanup job')
    // Add cleanup logic here
  })
  
  logger.info('Cron jobs started')
}
