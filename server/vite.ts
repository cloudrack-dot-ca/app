import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: 'client'
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  console.log('Vite middleware configured in development mode');

  return server;
}

export function serveStatic(app: Express) {
  const publicDir = path.join(process.cwd(), 'dist', 'server', 'public');
  console.log(`Serving static files from: ${publicDir}`);

  // Check if the directory exists
  if (!fs.existsSync(publicDir)) {
    console.error(`Static directory does not exist: ${publicDir}`);
    console.error('Did you run npm run build?');

    // Create a fallback route
    app.get('*', (_req, res) => {
      res.status(500).send('Application not built correctly. Please run npm run build.');
    });
    return;
  }

  // Serve static files
  app.use(express.static(publicDir));

  // For SPA routing - send the index.html for any non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next();
    }

    const indexHtml = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(404).send('Application not built correctly. index.html not found.');
    }
  });
}
