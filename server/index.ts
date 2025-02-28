import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
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
        password: "admin123", // This should be changed in production
        isAdmin: true,
        balance: 10000, // $100.00 starting balance
        apiKey: null
      });
      log("Created default admin user: admin / admin123");
      
      // Create a regular user
      const user = await storage.createUser({
        username: "user",
        password: "user123", 
        isAdmin: false,
        balance: 5000, // $50.00 starting balance
        apiKey: null
      });
      log("Created default regular user: user / user123");
      
      // Create a test server for the regular user
      const server = await storage.createServer({
        userId: user.id,
        name: "Test Server",
        region: "nyc1",
        size: "s-1vcpu-1gb",
        dropletId: "12345",
        status: "active",
        ipAddress: "192.168.1.1",
        specs: {
          memory: 1024,
          vcpus: 1,
          disk: 25
        },
        application: null
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
      
      log("Created test data (server and support ticket)");
    }
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

(async () => {
  // Create test data including admin user
  await createTestData();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
