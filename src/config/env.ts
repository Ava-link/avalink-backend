import { z } from 'zod';
import dotenv from 'dotenv';

/**
 * Centralized Environment Configuration
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all environment variables.
 * All configuration is validated at application startup using Zod.
 * 
 * Usage in other files:
 *   import { env } from './config/env';
 *   const port = env.PORT; // fully typed and validated
 * 
 * DO NOT use process.env directly in other files!
 */

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable schema using Zod
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database Configuration
  DB_HOST: z.string().min(1, 'Database host is required'),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_NAME: z.string().min(1, 'Database name is required'),
  DB_USER: z.string().min(1, 'Database user is required'),
  DB_PASSWORD: z.string().min(1, 'Database password is required'),
  DB_SSL: z.string().default('true').transform((val) => val === 'true'),

  // Database Pool Configuration
  DB_MAX_CONNECTIONS: z.string().default('20').transform(Number),
  DB_IDLE_TIMEOUT: z.string().default('30000').transform(Number),
  DB_CONNECTION_TIMEOUT: z.string().default('2000').transform(Number),

  // Blockchain Configuration
  DEPLOYER_PRIVATE_KEY: z.string().min(1, 'Deployer private key is required'),
  DEFAULT_GAS_LIMIT: z.string().default('5000000').transform(Number),
});

/**
 * Parse and validate environment variables
 */
const parseEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);
    console.log('✓ Environment variables validated successfully');
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('✗ Environment validation failed:');
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
};

/**
 * Validated environment variables
 */
export const env = parseEnv();

/**
 * Type of environment variables
 */
export type Env = z.infer<typeof envSchema>;

