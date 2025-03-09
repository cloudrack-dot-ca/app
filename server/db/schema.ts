import { pgTable, serial, integer, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Define the deployments table schema
export const deployments = pgTable('deployments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  appId: text('app_id'),
  name: text('name').notNull(),
  repository: text('repository').notNull(),
  branch: text('branch').notNull(),
  status: text('status').notNull(),
  url: text('url'),
  region: text('region').notNull(),
  size: text('size').notNull(),
  envVars: text('env_vars'),
  createdAt: timestamp('created_at').defaultNow(),
  lastDeployedAt: timestamp('last_deployed_at').defaultNow()
});

// Define GitHub connections table
export const githubConnections = pgTable('github_connections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  githubUserId: integer('github_user_id'),
  githubUsername: text('github_username'),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  scopes: text('scopes'),
  connectedAt: timestamp('connected_at').defaultNow()
});

// Add the schema to typescript declarations
declare global {
  interface DB {
    deployments: typeof deployments;
    githubConnections: typeof githubConnections;
  }
}
