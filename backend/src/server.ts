import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import path from 'path'

import { config } from '@/config/environment'
import { logger } from '@/utils/logger'
import { connectDatabase } from '@/database/connection'
import { connectRedis } from '@/database/redis'
import { setupSwagger } from '@/config/swagger'
import { errorHandler } from '@/middleware/errorHandler'
import { requestLogger } from '@/middleware/requestLogger'
import { validateRequest } from '@/middleware/validation'
import { setupRoutes } from '@/routes'
import { startCronJobs } from '@/services/cronService'
import { gracefulShutdown } from '@/utils/gracefulShutdown'

class Server {
  private app: express.Application
  private server?: import('http').Server

  constructor() {
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }))

    // CORS configuration
    this.app.use(cors({
      origin: config.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }))

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.NODE_ENV === 'production' ? 100 : 1000, // requests per window
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    })
    this.app.use('/api', limiter)

    // Body parsing middleware
    this.app.use(compression())
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))
    this.app.use(cookieParser())

    // Request logging
    this.app.use(requestLogger)

    // Static files
    this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
    
    // Serve frontend in production
    if (config.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(process.cwd(), 'public')))
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
      })
    })

    // API routes
    setupRoutes(this.app)

    // Swagger documentation
    if (config.NODE_ENV !== 'production') {
      setupSwagger(this.app)
    }

    // Serve frontend for SPA routing in production
    if (config.NODE_ENV === 'production') {
      this.app.get('*', (req, res) => {
        res.sendFile(path.join(process.cwd(), 'public', 'index.html'))
      })
    }
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
      })
    })

    // Global error handler
    this.app.use(errorHandler)
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase()
      logger.info('Database connected successfully')

      // Connect to Redis (optional)
      try {
        await connectRedis()
        logger.info('Redis connected successfully')
      } catch (error) {
        logger.warn('Redis connection failed, continuing without cache:', error)
      }

      // Start cron jobs
      startCronJobs()
      logger.info('Cron jobs started')

      // Start server
      this.server = this.app.listen(config.PORT, () => {
        logger.info(`Server running on port ${config.PORT}`)
        logger.info(`Environment: ${config.NODE_ENV}`)
        logger.info(`API Documentation: http://localhost:${config.PORT}/api-docs`)
      })

      // Setup graceful shutdown
      gracefulShutdown(this.server)

    } catch (error) {
      logger.error('Failed to start server:', error)
      process.exit(1)
    }
  }

  public getApp(): express.Application {
    return this.app
  }

  public async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          logger.info('Server stopped')
          resolve()
        })
      })
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server()
  server.start().catch((error) => {
    logger.error('Failed to start server:', error)
    process.exit(1)
  })
}

export { Server }
export default Server
