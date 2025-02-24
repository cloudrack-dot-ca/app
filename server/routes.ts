import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { digitalOcean } from "./digital-ocean";
import { insertServerSchema, insertVolumeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/regions", async (_req, res) => {
    const regions = await digitalOcean.getRegions();
    res.json(regions);
  });

  app.get("/api/sizes", async (_req, res) => {
    const sizes = await digitalOcean.getSizes();
    res.json(sizes);
  });

  app.get("/api/servers", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const servers = await storage.getServersByUser(req.user.id);
    res.json(servers);
  });

  app.post("/api/servers", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    const parsed = insertServerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const droplet = await digitalOcean.createDroplet({
      name: parsed.data.name,
      region: parsed.data.region,
      size: parsed.data.size,
    });

    const server = await storage.createServer({
      ...parsed.data,
      userId: req.user.id,
      dropletId: droplet.id,
      ipAddress: droplet.ip_address,
      status: "new",
      specs: {
        memory: 1024,
        vcpus: 1,
        disk: 25,
      },
    });

    res.status(201).json(server);
  });

  app.delete("/api/servers/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    await digitalOcean.deleteDroplet(server.dropletId);
    await storage.deleteServer(server.id);
    res.sendStatus(204);
  });

  app.get("/api/servers/:id/volumes", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    const volumes = await storage.getVolumesByServer(server.id);
    res.json(volumes);
  });

  app.post("/api/servers/:id/volumes", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || server.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    const parsed = insertVolumeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const doVolume = await digitalOcean.createVolume({
      name: parsed.data.name,
      region: server.region,
      size_gigabytes: parsed.data.size,
    });

    const volume = await storage.createVolume({
      ...parsed.data,
      userId: req.user.id,
      serverId: server.id,
      volumeId: doVolume.id,
      region: server.region,
    });

    res.status(201).json(volume);
  });

  const httpServer = createServer(app);
  return httpServer;
}
