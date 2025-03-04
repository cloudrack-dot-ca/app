import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { updateSiteSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/settings", async (_req, res) => {
    const settings = await storage.getSiteSettings();
    res.json(settings);
  });

  app.post("/api/settings", async (req, res) => {
    const result = updateSiteSettingsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid settings data" });
    }

    const settings = await storage.updateSiteSettings(result.data);
    res.json(settings);
  });

  const httpServer = createServer(app);
  return httpServer;
}
