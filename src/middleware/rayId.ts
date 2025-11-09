import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { logEndpoint } from '../config/logger';

/**
 * Ray-ID Middleware
 * 
 * Generates a unique Ray-ID for each request and attaches it to the request object
 * Also logs the endpoint with the Ray-ID for traceability
 */

export const rayIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique Ray-ID
  const rayId = randomUUID();
  
  // Attach Ray-ID to request
  req.rayId = rayId;
  
  // Also add to response headers for client-side tracking
  res.setHeader('X-Ray-ID', rayId);
  
  // Log the endpoint with Ray-ID
  logEndpoint(req.method, req.path, rayId, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  next();
};

