import { Request, Response } from 'express';
import healthService from '../services/health.service';
import { env } from '../config/env';

class HealthController {
  /**
   * Handle health check request
   * GET /health
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await healthService.checkHealth();
      
      const statusCode = healthStatus.status === 'ok' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      console.error('Health check controller error:', error);
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        environment: env.NODE_ENV
      });
    }
  }
}

export default new HealthController();

