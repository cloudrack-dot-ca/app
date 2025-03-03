import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for local development
if (process.env.NODE_ENV === 'development') {
  // In development, use direct connection without WebSocket
  neonConfig.useSecureWebSocket = false;
  neonConfig.webSocketConstructor = undefined;
} else {
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
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1); // Exit on critical database errors
});

export const db = drizzle({ client: pool, schema });