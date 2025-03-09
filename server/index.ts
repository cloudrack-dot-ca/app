import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { db, pool } from "./db";
import { users } from "@shared/schema";
import { setupAuth, hashPassword } from "./auth";
import { eq } from "drizzle-orm";
import { registerAdminRoutes } from "./admin/routes";
import githubRoutes from "./routes/github";
import githubWebhookRoutes from "./routes/github-webhooks";
import githubDebugRoutes from "./routes/github-debug";
import { logger } from "./utils/logger";
import githubDeploymentsRoutes from "./routes/github-deployments";
import appPlatformRoutes from "./routes/app-platform";
import apiDebugRoutes from './routes/api-debug';
import githubConnectionsRoutes from "./routes/github-connections";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.api(
        "Request completed",
        req.method,
        path,
        res.statusCode,
        duration
      );

      // Optional: log response body for debugging in development
      if (process.env.NODE_ENV === "development" && capturedJsonResponse) {
        const responsePreview =
          JSON.stringify(capturedJsonResponse).length > 100
            ? JSON.stringify(capturedJsonResponse).substring(0, 97) + "..."
            : JSON.stringify(capturedJsonResponse);
        logger.debug(`Response: ${responsePreview}`);
      }
    }
  });

  next();
});

// Create default users and test data
async function createTestData() {
  try {
    // Check if any admin users exist
    const admins = await db.select().from(users).where(eq(users.isAdmin, true));

    if (admins.length === 0) {
      // Create default admin user
      const admin = await storage.createUser({
        username: "admin",
        password: await hashPassword("admin123"), // Properly hashed password
        isAdmin: true,
        balance: 10000, // $100.00 starting balance
        apiKey: null
      });
      logger.success("Created default admin user: admin / admin123");

      // Create a regular user
      const user = await storage.createUser({
        username: "user",
        password: await hashPassword("user123"), // Properly hashed password
        isAdmin: false,
        balance: 5000, // $50.00 starting balance
        apiKey: null
      });
      logger.success("Created default regular user: user / user123");

      // Create a test server for the regular user
      const server = await storage.createServer({
        userId: user.id,
        name: "Test Server",
        region: "tor1",
        size: "s-1vcpu-1gb",
        dropletId: "12345",
        status: "active",
        ipAddress: "192.168.1.1",
        ipv6Address: null,
        specs: {
          memory: 1024,
          vcpus: 1,
          disk: 25
        },
        application: null,
        lastMonitored: new Date(),
        rootPassword: "Test123!" // Add default root password for test server
      });

      // Create a test support ticket
      const ticket = await storage.createTicket({
        userId: user.id,
        serverId: server.id,
        subject: "Help with server configuration",
        priority: "normal",
        status: "open",
        originalDropletId: server.dropletId
      });

      // Add a message to the ticket
      await storage.createMessage({
        ticketId: ticket.id,
        userId: user.id,
        message: "I need help configuring my server. Can you assist?"
      });

      logger.success("Created test data (server and support ticket)");
    }
  } catch (error) {
    logger.error("Error creating test data:", error);
  }
}

(async () => {
  try {
    // Test database connection first
    await pool.query('SELECT 1');
    logger.database("Database connection successful");

    // Run necessary migrations
    try {
      // Run snapshots table migration
      const { runMigration: runSnapshotsMigration } = await import('../migrations/add-snapshots-table.js');
      const snapshotsResult = await runSnapshotsMigration();
      if (snapshotsResult) {
        logger.success("Snapshots table migration completed successfully");
      } else {
        logger.warning("Snapshots table migration failed or was already applied");
      }

      // Run GitHub token migration
      const { runMigration: runGitHubTokenMigration } = await import('../migrations/add-github-token.js');
      const githubTokenResult = await runGitHubTokenMigration();
      if (githubTokenResult) {
        logger.success("GitHub token migration completed successfully");
      } else {
        logger.warning("GitHub token migration failed or was already applied");
      }
    } catch (migrationError) {
      logger.error("Error running migrations:", migrationError);
    }

    // Create test data including admin user
    await createTestData();

    // Set up authentication before routes
    setupAuth(app);

    // Register admin routes before regular routes
    registerAdminRoutes(app);

    const server = await registerRoutes(app);

    app.use("/api/github", githubRoutes);
    app.use("/api/github/deployments", githubDeploymentsRoutes);
    app.use("/api/github/webhooks", githubWebhookRoutes); // Register GitHub webhook routes
    app.use("/api/github/debug", githubDebugRoutes); // Register GitHub debug routes
    app.use("/api/github/connections", githubConnectionsRoutes); // Add this new route
    app.use("/api/app-platform", appPlatformRoutes);
    app.use('/api/debug', apiDebugRoutes);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      logger.error("Express error handler:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Use port 5000 for development
    const port = process.env.NODE_ENV === 'development' ? 5000 : (process.env.PORT || 8080);
    logger.server(`Starting server on port ${port}, NODE_ENV: ${process.env.NODE_ENV}`);

    server.listen({
      port,
      host: "0.0.0.0", // Explicitly listen on all network interfaces
      reusePort: true,
    }, () => {
      logger.success(`Server running on port ${port} and accessible from all network interfaces`);
    });
  } catch (error) {
    logger.error("Application startup error:", error);
    process.exit(1);
  }
})();