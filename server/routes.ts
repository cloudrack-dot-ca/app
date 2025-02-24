import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { digitalOcean } from "./digital-ocean";
import { insertServerSchema, insertVolumeSchema } from "@shared/schema";
import { createSubscription, capturePayment, plans } from "./paypal";

async function checkSubscriptionLimits(userId: number) {
  // Get user's active subscription
  const subscriptions = await storage.getSubscriptionsByUser(userId);
  const activeSubscription = subscriptions.find(sub => sub.status === "active");

  if (!activeSubscription) {
    throw new Error("No active subscription found. Please subscribe to a plan.");
  }

  const plan = plans[activeSubscription.planId as keyof typeof plans];
  if (!plan) {
    throw new Error("Invalid subscription plan");
  }

  // Check server limits
  const userServers = await storage.getServersByUser(userId);
  if (userServers.length >= plan.limits.maxServers) {
    throw new Error(`Server limit reached. Your ${plan.name} allows up to ${plan.limits.maxServers} servers.`);
  }

  // Check storage limits
  const userVolumes = await Promise.all(
    userServers.map(server => storage.getVolumesByServer(server.id))
  );
  const totalStorage = userVolumes.flat().reduce((sum, vol) => sum + vol.size, 0);

  if (totalStorage >= plan.limits.maxStorageGB) {
    throw new Error(`Storage limit reached. Your ${plan.name} allows up to ${plan.limits.maxStorageGB}GB of storage.`);
  }

  return plan;
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
      // Check subscription limits before creating server
      await checkSubscriptionLimits(req.user.id);

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

  app.post("/api/billing/capture/:orderId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const { orderId } = req.params;
    const { planId } = req.body;

    try {
      const payment = await capturePayment(orderId);

      // Create subscription record
      const subscription = await storage.createSubscription({
        userId: req.user.id,
        planId,
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        paypalSubscriptionId: payment.id,
      });

      // Create transaction record
      await storage.createTransaction({
        userId: req.user.id,
        subscriptionId: subscription.id,
        amount: Math.round(plans[planId as keyof typeof plans].price * 100),
        currency: "USD",
        status: "completed",
        paypalTransactionId: payment.id,
        createdAt: new Date(),
      });

      res.json({ subscription, payment });
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