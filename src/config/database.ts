import { Pool } from 'pg';
import { env } from './env.js';
import { parse } from 'pg-connection-string';

// Parse the connection string and force IPv4
const config = parse(env.DATABASE_URL);

const pool = new Pool({
  host: config.host || undefined,
  port: config.port ? parseInt(config.port) : undefined,
  database: config.database || undefined,
  user: config.user || undefined,
  password: config.password || undefined,
  ssl: {
    rejectUnauthorized: false
  },
  max: env.DB_MAX_CONNECTIONS,
  idleTimeoutMillis: env.DB_IDLE_TIMEOUT,
  connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT,
});

// Test database connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('✗ Unexpected database error:', err);
  process.exit(-1);
});

export default pool;

