/**
 * Express Type Extensions
 * 
 * Extends Express Request type to include custom properties
 */

declare namespace Express {
  export interface Request {
    rayId?: string;
  }
}

