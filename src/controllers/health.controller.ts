import { Request, Response } from 'express';
import healthService from '../services/health.service';
import { env } from '../config/env';
import logger, { logFunctionEntry } from '../config/logger';

class HealthController {
  /**
   * Handle health check request
   * GET /health
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    logFunctionEntry('HealthController.getHealth', req.rayId);
    try {
      const healthStatus = await healthService.checkHealth();
      
      const statusCode = healthStatus.status === 'ok' ? 200 : 503;
      logger.info('Health check completed', { rayId: req.rayId, functionName: 'HealthController.getHealth', status: healthStatus.status });
      res.status(statusCode).json({ ...healthStatus, rayId: req.rayId });
    } catch (error) {
      logger.error('Health check controller error', { rayId: req.rayId, functionName: 'HealthController.getHealth', error: error instanceof Error ? error.message : 'Unknown error' });
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        environment: env.NODE_ENV,
        rayId: req.rayId
      });
    }
  }
}

export default new HealthController();

