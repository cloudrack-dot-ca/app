import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

console.log("NODE_ENV:", process.env.NODE_ENV);

// Configure WebSocket for local development
if (process.env.NODE_ENV === 'development') {
  console.log("Using development configuration - disabling WebSocket");
  // In development, use direct connection without WebSocket
  neonConfig.useSecureWebSocket = false;
  neonConfig.webSocketConstructor = undefined;
} else {
  console.log("Using production configuration - enabling WebSocket");
  // In production, use secure WebSocket
  neonConfig.webSocketConstructor = ws;
}

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
  maxUses: 7500, // Number of times a client can be used before being recycled
  ssl: {
    rejectUnauthorized: false // This allows self-signed certificates
  }
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

export const db = drizzle({ client: pool, schema });