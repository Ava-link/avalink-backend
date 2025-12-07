import winston from 'winston';
import { env } from './env';

/**
 * Winston Logger Configuration
 * 
 * Provides structured logging with different transports and formats
 */

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Custom replacer to handle BigInt serialization
const bigIntReplacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, rayId, endpoint, functionName, ...meta } = info;

    let logMessage = `${timestamp} [${level}]`;

    // Add Ray-ID if present
    if (rayId) {
      logMessage += ` [Ray-ID: ${rayId}]`;
    }

    // Add endpoint if present
    if (endpoint) {
      logMessage += ` [${endpoint}]`;
    }

    // Add function name if present
    if (functionName) {
      logMessage += ` [${functionName}]`;
    }

    logMessage += `: ${message}`;

    // Add any additional metadata with BigInt support
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, bigIntReplacer)}`;
    }

    return logMessage;
  })
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// Create the logger
const logger = winston.createLogger({
  levels: logLevels,
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
    }),

    // File transport for deployment logs
    new winston.transports.File({
      filename: 'logs/deployments.log',
      format: fileFormat,
    }),
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
});

/**
 * Log with Ray-ID context
 */
export const logWithRayId = (
  level: 'error' | 'warn' | 'info' | 'http' | 'debug',
  message: string,
  rayId?: string,
  meta?: Record<string, any>
) => {
  logger.log(level, message, { rayId, ...meta });
};

/**
 * Log function entry with Ray-ID
 */
export const logFunctionEntry = (
  functionName: string,
  rayId?: string,
  meta?: Record<string, any>
) => {
  logger.info(`Entering function`, { functionName, rayId, ...meta });
};

/**
 * Log endpoint call with Ray-ID
 */
export const logEndpoint = (
  method: string,
  endpoint: string,
  rayId: string,
  meta?: Record<string, any>
) => {
  logger.http(`${method} ${endpoint}`, { endpoint: `${method} ${endpoint}`, rayId, ...meta });
};

export default logger;

