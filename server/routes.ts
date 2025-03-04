import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { maintenanceSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Maintenance settings routes
  app.get("/api/maintenance", async (_req, res) => {
    const settings = await storage.getMaintenanceSettings();
    res.json(settings);
  });

  app.patch("/api/admin/maintenance", async (req, res) => {
    try {
      const settings = maintenanceSettingsSchema.partial().parse(req.body);
      const updated = await storage.updateMaintenanceSettings(settings);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid maintenance settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
