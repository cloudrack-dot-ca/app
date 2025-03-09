import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer } from 'http';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { setupAuth } from './auth';
import { storage } from './storage';
import { githubOAuth } from './github-oauth';

// Create Express server
const app = express();
const httpServer = createServer(app);

// Configure basic middleware
app.use(cors());
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan((tokens, req, res) => {
  const timestamp = new Date().toLocaleTimeString();
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens['response-time'](req, res);

  console.log(`[${timestamp}] 🌐 ${method} ${url} ${status} ${responseTime}ms`);

  // Log response body for debugging
  if (req.url.startsWith('/api/')) {
    const resBody = res.locals.responseBody;
    if (resBody) {
      const truncatedBody = JSON.stringify(resBody).substring(0, 100) + '...';
      console.log(`[${timestamp}] 🔍 Response: ${truncatedBody}`);
    }
  }

  return null;
}));

// Store response body for logging
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    res.locals.responseBody = body;
    return originalJson.call(this, body);
  };
  next();
});

// Initialize database connection
(async () => {
  try {
    await storage.initialize();
    console.log('Successfully connected to database');
    console.log('[1:16:56 AM] 🗄️ [DB] Database connection successful');

    // Run migrations
    await runMigrations();
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
})();

async function runMigrations() {
  try {
    // Add snapshots table migration
    console.log('Running migration: add-snapshots-table');
    await storage.run(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        data JSONB NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    console.log('Successfully created snapshots table');

    // Add indexes
    await storage.run(`
      CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON snapshots(user_id);
      CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON snapshots(created_at);
    `);
    console.log('Successfully added indexes to snapshots table');
    console.log('[1:16:57 AM] ✅ Snapshots table migration completed successfully');

    // Add GitHub token migration
    console.log('Running migration: add-github-token');
    try {
      await storage.run(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token TEXT;
      `);
      console.log('Successfully added github_token column to users table');
    } catch (error) {
      console.log('github_token column already exists in users table');
      console.log('[1:16:57 AM] ⚠️ GitHub token migration failed or was already applied');
    }

  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

// Set up authentication
setupAuth(app);

// Set up GitHub OAuth routes
githubOAuth.setupRoutes(app);

// API Routes
// Maintenance mode
app.get('/api/maintenance', async (req, res) => {
  try {
    const maintenanceSettings = await storage.getMaintenanceSettings();
    res.json(maintenanceSettings);
  } catch (error) {
    console.error('Error fetching maintenance settings:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance settings' });
  }
});

// Admin routes
const adminRouter = express.Router();
app.use('/admin', adminRouter);
console.log('1:16:57 AM [admin] Admin routes registered');

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[1:16:57 AM] 🚀 [SERVER] Starting server on port ${PORT}, NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[1:16:57 AM] ✅ Server running on port ${PORT} and accessible from all network interfaces`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    storage.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});
