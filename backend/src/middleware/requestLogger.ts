import { Request, Response, NextFunction } from 'express'
import { logApiRequest } from '@/utils/logger'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now()
  
  // Override res.end to capture response
  const originalEnd = res.end
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime
    
    logApiRequest(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      (req as any).user?.id,
      req.get('User-Agent'),
      req.ip
    )
    
    originalEnd.call(this, chunk, encoding)
  }
  
  next()
}
