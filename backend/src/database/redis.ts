import Redis from 'ioredis'
import { redisConfig, config } from '@/config/environment'
import { logger } from '@/utils/logger'

let redis: Redis | null = null

export const connectRedis = async (): Promise<Redis | null> => {
  if (!redisConfig) {
    logger.info('Redis configuration not provided, skipping Redis connection')
    return null
  }

  if (redis) {
    return redis
  }

  try {
    redis = new Redis({
      ...redisConfig,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      retryDelayOnClusterDown: 300,
      enableOfflineQueue: false,
      connectTimeout: 10000,
      commandTimeout: 5000,
    })

    // Event handlers
    redis.on('connect', () => {
      logger.info('Redis connection established')
    })

    redis.on('ready', () => {
      logger.info('Redis is ready to receive commands')
    })

    redis.on('error', (error) => {
      logger.error('Redis connection error:', error)
    })

    redis.on('close', () => {
      logger.warn('Redis connection closed')
    })

    redis.on('reconnecting', (ms) => {
      logger.info(`Redis reconnecting in ${ms}ms`)
    })

    redis.on('end', () => {
      logger.info('Redis connection ended')
    })

    // Test connection
    await redis.connect()
    await redis.ping()

    logger.info('Redis connected successfully', {
      host: redisConfig.host,
      port: redisConfig.port,
      db: redisConfig.db,
    })

    return redis
  } catch (error) {
    logger.error('Failed to connect to Redis:', error)
    redis = null
    throw error
  }
}

export const getRedis = (): Redis | null => {
  return redis
}

export const closeRedis = async (): Promise<void> => {
  if (redis) {
    await redis.quit()
    redis = null
    logger.info('Redis connection closed')
  }
}

// Cache helper class
export class CacheService {
  private redis: Redis | null
  private keyPrefix: string

  constructor(keyPrefix = 'kdfamily:') {
    this.redis = getRedis()
    this.keyPrefix = keyPrefix
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.redis) return null

    try {
      const value = await this.redis.get(this.getKey(key))
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error('Cache get error:', { key, error })
      return null
    }
  }

  async set(
    key: string,
    value: any,
    ttlSeconds?: number
  ): Promise<boolean> {
    if (!this.redis) return false

    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds) {
        await this.redis.setex(this.getKey(key), ttlSeconds, serialized)
      } else {
        await this.redis.set(this.getKey(key), serialized)
      }
      return true
    } catch (error) {
      logger.error('Cache set error:', { key, error })
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      const result = await this.redis.del(this.getKey(key))
      return result > 0
    } catch (error) {
      logger.error('Cache delete error:', { key, error })
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      const result = await this.redis.exists(this.getKey(key))
      return result === 1
    } catch (error) {
      logger.error('Cache exists error:', { key, error })
      return false
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redis) return false

    try {
      const result = await this.redis.expire(this.getKey(key), ttlSeconds)
      return result === 1
    } catch (error) {
      logger.error('Cache expire error:', { key, error })
      return false
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.redis) return -1

    try {
      return await this.redis.ttl(this.getKey(key))
    } catch (error) {
      logger.error('Cache TTL error:', { key, error })
      return -1
    }
  }

  async flush(): Promise<boolean> {
    if (!this.redis) return false

    try {
      await this.redis.flushdb()
      return true
    } catch (error) {
      logger.error('Cache flush error:', error)
      return false
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.redis) return []

    try {
      const keys = await this.redis.keys(this.getKey(pattern))
      return keys.map(key => key.replace(this.keyPrefix, ''))
    } catch (error) {
      logger.error('Cache keys error:', { pattern, error })
      return []
    }
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.redis) return null

    try {
      return await this.redis.hget(this.getKey(key), field)
    } catch (error) {
      logger.error('Cache hget error:', { key, field, error })
      return null
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      await this.redis.hset(this.getKey(key), field, value)
      return true
    } catch (error) {
      logger.error('Cache hset error:', { key, field, error })
      return false
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.redis) return {}

    try {
      return await this.redis.hgetall(this.getKey(key))
    } catch (error) {
      logger.error('Cache hgetall error:', { key, error })
      return {}
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.redis) return 0

    try {
      return await this.redis.lpush(this.getKey(key), ...values)
    } catch (error) {
      logger.error('Cache lpush error:', { key, error })
      return 0
    }
  }

  async rpop(key: string): Promise<string | null> {
    if (!this.redis) return null

    try {
      return await this.redis.rpop(this.getKey(key))
    } catch (error) {
      logger.error('Cache rpop error:', { key, error })
      return null
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.redis) return []

    try {
      return await this.redis.lrange(this.getKey(key), start, stop)
    } catch (error) {
      logger.error('Cache lrange error:', { key, start, stop, error })
      return []
    }
  }
}

// Create default cache service instance
export const cache = new CacheService()

// Health check
export const checkRedisHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy' | 'disabled'
  details: Record<string, any>
}> => {
  if (!redis) {
    return {
      status: 'disabled',
      details: { message: 'Redis not configured' },
    }
  }

  try {
    const start = Date.now()
    await redis.ping()
    const responseTime = Date.now() - start

    const info = await redis.info('memory')
    const memoryInfo = info
      .split('\r\n')
      .filter(line => line.includes(':'))
      .reduce((acc, line) => {
        const [key, value] = line.split(':')
        acc[key] = value
        return acc
      }, {} as Record<string, string>)

    return {
      status: 'healthy',
      details: {
        responseTime: `${responseTime}ms`,
        memory: {
          used: memoryInfo.used_memory_human,
          peak: memoryInfo.used_memory_peak_human,
        },
        config: {
          host: redisConfig?.host,
          port: redisConfig?.port,
          db: redisConfig?.db,
        },
      },
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing Redis connection...')
  await closeRedis()
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing Redis connection...')
  await closeRedis()
})
