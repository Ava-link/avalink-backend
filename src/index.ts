import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import logger from './config/logger';
import { rayIdMiddleware } from './middleware/rayId';
import healthRouter from './routes/health';
import deploymentRouter from './routes/deployment';
import availableRouter from './routes/available';

// Add global error handlers at the very top
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  logger.error('Unhandled rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

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
app.use('/available', availableRouter);

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
try {
  const server = app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT} in ${env.NODE_ENV} environment.`);
    logger.info(`http://localhost:${PORT}`);
  });

  server.on('error', (err: any) => {
    logger.error('Server error', { error: err.message, code: err.code });
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use!`);
      logger.error('Try: lsof -ti:${PORT} | xargs kill -9');
    }
    process.exit(1);
  });

  server.on('listening', () => {
  });
} catch (error) {
  logger.error('Failed to start server', { error });
  process.exit(1);
}

export default app;