import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { digitalOcean } from "./digital-ocean";
import { insertServerSchema, insertVolumeSchema } from "@shared/schema";
import { createSubscription, capturePayment } from "./paypal";

// Cost constants
const COSTS = {
  servers: {
    "s-1vcpu-1gb": 500, // $5.00
    "s-1vcpu-2gb": 1000, // $10.00
    "s-2vcpu-4gb": 2000, // $20.00
  },
  storage: 10, // $0.10 per GB
};

async function checkBalance(userId: number, cost: number) {
  const user = await storage.getUser(userId);
  if (!user || user.balance < cost) {
    throw new Error("Insufficient balance. Please add funds to your account.");
  }
}

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

    try {
      const parsed = insertServerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      // Check if user has enough balance
      const monthlyCost = COSTS.servers[parsed.data.size as keyof typeof COSTS.servers];
      await checkBalance(req.user.id, monthlyCost);

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

      // Deduct balance and create transaction
      await storage.updateUserBalance(req.user.id, -monthlyCost);
      await storage.createTransaction({
        userId: req.user.id,
        amount: monthlyCost,
        currency: "USD",
        status: "completed",
        type: "server_charge",
        createdAt: new Date(),
      });

      res.status(201).json(server);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
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

  app.get("/api/billing/plans", (_req, res) => {
    res.json(plans);
  });

  app.post("/api/billing/subscribe", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: "Plan ID is required" });

    try {
      const order = await createSubscription(planId);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/billing/deposit", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const order = await createSubscription("deposit");
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/billing/capture/:orderId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const { orderId } = req.params;

    try {
      const payment = await capturePayment(orderId);
      const amount = 10000; // $100.00

      // Add to user's balance
      await storage.updateUserBalance(req.user.id, amount);

      // Create transaction record
      await storage.createTransaction({
        userId: req.user.id,
        amount,
        currency: "USD",
        status: "completed",
        type: "deposit",
        paypalTransactionId: payment.id,
        createdAt: new Date(),
      });

      res.json({ payment });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/billing/subscriptions", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const subscriptions = await storage.getSubscriptionsByUser(req.user.id);
    res.json(subscriptions);
  });

  app.get("/api/billing/transactions", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const transactions = await storage.getTransactionsByUser(req.user.id);
    res.json(transactions);
  });

  const httpServer = createServer(app);
  return httpServer;
}