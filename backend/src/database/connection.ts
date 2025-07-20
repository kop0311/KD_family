import mysql from 'mysql2/promise'
import { databaseConfig, isTest } from '@/config/environment'
import { logger } from '@/utils/logger'

let pool: mysql.Pool | null = null

export const connectDatabase = async (): Promise<mysql.Pool> => {
  if (pool) {
    return pool
  }

  try {
    // Create connection pool
    pool = mysql.createPool({
      ...databaseConfig,
      waitForConnections: true,
      queueLimit: 0,
      // Connection pool settings
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      // Character set
      charset: 'utf8mb4',
      // Timezone
      timezone: '+00:00',
      // SQL mode
      sql_mode: 'TRADITIONAL',
      // Enable multiple statements (be careful with this)
      multipleStatements: false,
      // Date handling
      dateStrings: false,
      // Type casting
      typeCast: (field, next) => {
        // Handle TINYINT(1) as boolean
        if (field.type === 'TINY' && field.length === 1) {
          return field.string() === '1'
        }
        // Handle JSON fields
        if (field.type === 'JSON') {
          try {
            return JSON.parse(field.string())
          } catch {
            return field.string()
          }
        }
        return next()
      },
    })

    // Test the connection
    const connection = await pool.getConnection()
    await connection.ping()
    connection.release()

    logger.info('Database connection pool created successfully', {
      host: databaseConfig.host,
      port: databaseConfig.port,
      database: databaseConfig.database,
      connectionLimit: databaseConfig.connectionLimit,
    })

    // Setup connection event handlers
    pool.on('connection', (connection) => {
      logger.debug(`New database connection established as id ${connection.threadId}`)
    })

    pool.on('error', (error) => {
      logger.error('Database pool error:', error)
      if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        logger.info('Attempting to reconnect to database...')
        // The pool will automatically create new connections
      }
    })

    return pool
  } catch (error) {
    logger.error('Failed to create database connection pool:', error)
    throw error
  }
}

export const getDatabase = (): mysql.Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.')
  }
  return pool
}

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end()
    pool = null
    logger.info('Database connection pool closed')
  }
}

// Query helper with automatic connection management
export const query = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> => {
  const db = getDatabase()
  try {
    const [rows] = await db.execute(sql, params)
    return rows as T[]
  } catch (error) {
    logger.error('Database query error:', {
      sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
      params: params.length > 0 ? '[PARAMS]' : 'none',
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

// Transaction helper
export const transaction = async <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const db = getDatabase()
  const connection = await db.getConnection()
  
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    logger.error('Transaction rolled back due to error:', error)
    throw error
  } finally {
    connection.release()
  }
}

// Batch insert helper
export const batchInsert = async (
  table: string,
  columns: string[],
  values: any[][],
  options: {
    onDuplicateKeyUpdate?: string[]
    chunkSize?: number
  } = {}
): Promise<void> => {
  if (values.length === 0) return

  const { onDuplicateKeyUpdate, chunkSize = 1000 } = options
  const db = getDatabase()

  const placeholders = `(${columns.map(() => '?').join(', ')})`
  let sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES `

  // Process in chunks to avoid max_allowed_packet issues
  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize)
    const chunkSql = sql + chunk.map(() => placeholders).join(', ')
    
    let finalSql = chunkSql
    if (onDuplicateKeyUpdate && onDuplicateKeyUpdate.length > 0) {
      const updateClause = onDuplicateKeyUpdate
        .map(col => `${col} = VALUES(${col})`)
        .join(', ')
      finalSql += ` ON DUPLICATE KEY UPDATE ${updateClause}`
    }

    const flatParams = chunk.flat()
    await db.execute(finalSql, flatParams)
  }
}

// Health check
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy'
  details: Record<string, any>
}> => {
  try {
    const db = getDatabase()
    const connection = await db.getConnection()
    
    const start = Date.now()
    await connection.ping()
    const responseTime = Date.now() - start
    
    // Get connection pool status
    const poolStatus = {
      totalConnections: (db as any)._allConnections?.length || 0,
      freeConnections: (db as any)._freeConnections?.length || 0,
      acquiringConnections: (db as any)._acquiringConnections?.length || 0,
    }
    
    connection.release()
    
    return {
      status: 'healthy',
      details: {
        responseTime: `${responseTime}ms`,
        pool: poolStatus,
        config: {
          host: databaseConfig.host,
          port: databaseConfig.port,
          database: databaseConfig.database,
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
  logger.info('Received SIGINT, closing database connections...')
  await closeDatabase()
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connections...')
  await closeDatabase()
})
