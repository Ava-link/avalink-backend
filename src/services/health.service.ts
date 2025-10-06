import pool from '../config/database';
import { env } from '../config/env';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database: {
    status: 'healthy' | 'unhealthy';
    timestamp?: string;
    error?: string;
  };
  environment: string;
}

class HealthService {
  /**
   * Check the overall health of the application
   * @returns {Promise<HealthStatus>} Health status information
   */
  async checkHealth(): Promise<HealthStatus> {
    const healthStatus: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: 'unhealthy'
      },
      environment: env.NODE_ENV
    };

    try {
      const dbStatus = await this.checkDatabaseConnection();
      healthStatus.database = dbStatus;
      healthStatus.status = dbStatus.status === 'healthy' ? 'ok' : 'error';
    } catch (error) {
      console.error('Database health check failed:', error);
      healthStatus.status = 'error';
      healthStatus.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return healthStatus;
  }

  /**
   * Check database connectivity
   * @returns {Promise<Object>} Database status
   */
  private async checkDatabaseConnection(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp?: string;
    error?: string;
  }> {
    try {
      const result = await pool.query('SELECT NOW()');
      
      if (result.rows && result.rows.length > 0) {
        return {
          status: 'healthy',
          timestamp: result.rows[0].now
        };
      }
      
      return {
        status: 'unhealthy',
        error: 'No rows returned from database'
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new HealthService();

