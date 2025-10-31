import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import logger from './config/logger';
import { rayIdMiddleware } from './middleware/rayId';
import healthRouter from './routes/health';
import deploymentRouter from './routes/deployment';

const app: Application = express();
const PORT = env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ray-ID middleware (must come before routes)
app.use(rayIdMiddleware);

// Routes
app.use('/', healthRouter);
app.use('/deploy', deploymentRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { 
    rayId: req.rayId,
    error: err.message,
    stack: err.stack 
  });
  res.status(500).json({
    status: 'error',
    message: env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    rayId: req.rayId
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════╗
║   Avalink Backend Server Started      ║
╠═══════════════════════════════════════╣
║  Port: ${PORT}                           ║
║  Environment: ${env.NODE_ENV}             ║
║  Check: http://localhost:${PORT}         ║
╚═══════════════════════════════════════╝
  `);
});

export default app;

