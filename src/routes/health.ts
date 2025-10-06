import { Router, type Router as ExpressRouter } from 'express';
import healthController from '../controllers/health.controller';

const router: ExpressRouter = Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', (req, res) => healthController.getHealth(req, res));

export default router;

