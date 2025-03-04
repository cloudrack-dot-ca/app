
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

console.log("NODE_ENV:", process.env.NODE_ENV);

// Use direct connection without WebSocket
console.log("Configuring direct PostgreSQL connection without WebSocket");
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with more robust settings
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: true } : 
    { rejectUnauthorized: false }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  // Only exit on critical errors
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
    process.exit(-1);
  }
});

// Add connection success logging
pool.on('connect', () => {
  console.log('Successfully connected to database');
});

export const db = drizzle(pool, { schema });
