import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { digitalOcean } from "./digital-ocean";
import { insertServerSchema, insertVolumeSchema, users, servers } from "@shared/schema";
import { createSubscription, capturePayment } from "./paypal";
import { insertTicketSchema, insertMessageSchema } from "@shared/schema";
import { db } from "./db";

// Cost constants
const COSTS = {
  servers: {
    "s-1vcpu-1gb": 7, // $0.007 per hour (~$5/mo)
    "s-1vcpu-2gb": 14, // $0.014 per hour (~$10/mo)
    "s-2vcpu-4gb": 28, // $0.028 per hour (~$20/mo)
  },
  storage: {
    baseRate: 0.00014, // DO base rate per GB per hour
    markup: 0.009, // Our markup per GB
    maxSize: 1000, // Maximum volume size in GB
  },
};

// Convert dollar amount to cents
function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Hourly billing
async function deductHourlyServerCosts() {
  const allServers = await storage.getAllServers();
  for (const server of allServers) {
    const user = await storage.getUser(server.userId);
    if (!user || user.balance < 100) { // Less than $1
      // If user can't pay, delete the server
      await digitalOcean.deleteDroplet(server.dropletId);
      await storage.deleteServer(server.id);
      continue;
    }

    // Deduct $1 per hour (100 cents)
    await storage.updateUserBalance(server.userId, -100);
    await storage.createTransaction({
      userId: server.userId,
      amount: -100,
      currency: "USD",
      status: "completed",
      type: "hourly_server_charge",
      paypalTransactionId: null,
      createdAt: new Date(),
    });
  }
}

// Run billing every hour
setInterval(deductHourlyServerCosts, 60 * 60 * 1000);

async function checkBalance(userId: number, costInDollars: number) {
  const costInCents = toCents(costInDollars);
  const user = await storage.getUser(userId);
  if (!user || user.balance < costInCents) {
    throw new Error("Insufficient balance. Please add funds to your account.");
  }
}

// Admin middleware to check if the user is an admin
function adminMiddleware(req: any, res: any, next: any) {
  if (!req.user) {
    return res.sendStatus(401);
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }

  next();
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

  app.get("/api/applications", async (_req, res) => {
    const applications = await digitalOcean.getApplications();
    res.json(applications);
  });
  
  // Admin API routes
  app.get("/api/admin/users", adminMiddleware, async (_req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/admin/tickets", adminMiddleware, async (_req, res) => {
    try {
      const allTickets = await storage.getAllTickets();
      res.json(allTickets);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/admin/servers", adminMiddleware, async (_req, res) => {
    try {
      const allServers = await storage.getAllServers();
      res.json(allServers);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.patch("/api/admin/tickets/:id", adminMiddleware, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { status, priority } = req.body;
      
      let updatedTicket;
      
      if (status) {
        updatedTicket = await storage.updateTicketStatus(ticketId, status);
      }
      
      if (priority) {
        updatedTicket = await storage.updateTicketPriority(ticketId, priority);
      }
      
      res.json(updatedTicket);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/servers", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    // If the user is an admin and specifically requests all servers
    if (req.user.isAdmin && req.query.all === 'true') {
      const servers = await storage.getAllServers();
      res.json(servers);
    } else {
      // Regular users or admins not requesting all servers only see their own
      const servers = await storage.getServersByUser(req.user.id);
      res.json(servers);
    }
  });

  app.get("/api/servers/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      
      // Allow access if the user is the owner or an admin
      if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
        return res.sendStatus(404);
      }
      
      res.json(server);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/servers", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const parsed = insertServerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      // Check if user has enough balance (require minimum 1h worth)
      const hourlyCost = 1; // $1 per hour
      const minimumBalance = toCents(hourlyCost); // Require 1h worth of balance in cents
      await checkBalance(req.user.id, hourlyCost);

      const auth = req.body.auth || {};

      const droplet = await digitalOcean.createDroplet({
        name: parsed.data.name,
        region: parsed.data.region,
        size: parsed.data.size,
        application: parsed.data.application,
        // Pass authentication details to DigitalOcean
        ssh_keys: auth.type === "ssh" ? [auth.value] : undefined,
        password: auth.type === "password" ? auth.value : undefined,
      });

      const server = await storage.createServer({
        ...parsed.data,
        userId: req.user.id,
        dropletId: droplet.id,
        ipAddress: droplet.ip_address,
        ipv6Address: null,
        status: "new",
        specs: {
          memory: 1024,
          vcpus: 1,
          disk: 25,
        },
        application: parsed.data.application || null,
        lastMonitored: null,
      });

      // Deduct balance and create transaction
      await storage.updateUserBalance(req.user.id, -minimumBalance);
      await storage.createTransaction({
        userId: req.user.id,
        amount: -minimumBalance,
        currency: "USD",
        status: "completed",
        type: "server_charge",
        paypalTransactionId: null,
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
    if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    // Delete the server from DigitalOcean
    try {
      await digitalOcean.deleteDroplet(server.dropletId);
    } catch (error) {
      console.warn(`Failed to delete droplet ${server.dropletId} from DigitalOcean, but proceeding with local deletion:`, error);
      // Continue with deletion even if the DigitalOcean API call fails
      // This allows us to clean up orphaned records in our database
    }

    // Keep the tickets but remove the server association
    try {
      const tickets = await storage.getTicketsByServer(server.id);
      for (const ticket of tickets) {
        if (ticket.status === 'open') {
          await storage.updateTicket(ticket.id, { serverId: null });
        }
      }
    } catch (error) {
      console.error('Error updating tickets:', error);
      // Continue with deletion even if updating tickets fails
    }

    // Delete the server from our database
    await storage.deleteServer(server.id);
    res.sendStatus(204);
  });

  app.get("/api/servers/:id/volumes", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
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

    // Validate volume size
    if (!parsed.data.size || parsed.data.size <= 0 || parsed.data.size > COSTS.storage.maxSize) {
      return res.status(400).json({
        message: `Volume size must be between 1GB and ${COSTS.storage.maxSize}GB`
      });
    }

    // Calculate hourly cost with markup
    const hourlyCost = parsed.data.size * (COSTS.storage.baseRate + COSTS.storage.markup);

    // Check if user has enough balance for at least 1 hour
    try {
      await checkBalance(req.user.id, hourlyCost);
    } catch (error) {
      return res.status(400).json({ 
        message: `Insufficient balance. Required: $${hourlyCost.toFixed(3)} per hour for ${parsed.data.size}GB`
      });
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

    // Deduct first hour's cost
    const costInCents = toCents(hourlyCost);
    await storage.updateUserBalance(req.user.id, -costInCents);
    await storage.createTransaction({
      userId: req.user.id,
      amount: -costInCents,
      currency: "USD",
      status: "completed",
      type: "volume_charge",
      paypalTransactionId: null,
      createdAt: new Date(),
    });

    res.status(201).json(volume);
  });

  app.delete("/api/servers/:id/volumes/:volumeId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    const volume = await storage.getVolume(parseInt(req.params.volumeId));
    if (!volume || volume.serverId !== server.id) {
      return res.sendStatus(404);
    }

    try {
      await digitalOcean.deleteVolume(volume.volumeId);
    } catch (error) {
      console.warn(`Failed to delete volume ${volume.volumeId} from DigitalOcean, but proceeding with local deletion:`, error);
      // Continue with deletion even if the DigitalOcean API call fails
    }
    
    await storage.deleteVolume(volume.id);
    res.sendStatus(204);
  });

  app.patch("/api/servers/:id/volumes/:volumeId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    const volume = await storage.getVolume(parseInt(req.params.volumeId));
    if (!volume || volume.serverId !== server.id) {
      return res.sendStatus(404);
    }

    const { size } = req.body;
    if (!size || size <= volume.size) {
      return res.status(400).json({ message: "New size must be greater than current size" });
    }

    if (size > COSTS.storage.maxSize) {
      return res.status(400).json({
        message: `Maximum volume size is ${COSTS.storage.maxSize}GB`
      });
    }

    // Calculate additional cost for the new size
    const newHourlyCost = size * (COSTS.storage.baseRate + COSTS.storage.markup);
    const currentHourlyCost = volume.size * (COSTS.storage.baseRate + COSTS.storage.markup);
    const additionalCost = newHourlyCost - currentHourlyCost;

    // Check if user has enough balance for the size increase
    try {
      await checkBalance(req.user.id, additionalCost);
    } catch (error) {
      return res.status(400).json({ 
        message: `Insufficient balance. Additional cost: $${additionalCost.toFixed(3)} per hour for ${size - volume.size}GB increase`
      });
    }

    // Update volume size
    volume.size = size;
    await storage.updateVolume(volume);

    // Deduct additional cost
    const costInCents = toCents(additionalCost);
    await storage.updateUserBalance(req.user.id, -costInCents);
    await storage.createTransaction({
      userId: req.user.id,
      amount: -costInCents,
      currency: "USD",
      status: "completed",
      type: "volume_resize_charge",
      paypalTransactionId: null,
      createdAt: new Date(),
    });

    res.json(volume);
  });

  app.post("/api/billing/deposit", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const { amount } = req.body;
    if (!amount || amount < 5) {
      return res.status(400).json({ message: "Minimum deposit amount is $5.00" });
    }

    try {
      const order = await createSubscription(amount);
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post("/api/billing/capture/:orderId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const { orderId } = req.params;

    try {
      const { payment, amount } = await capturePayment(orderId);

      // Add to user's balance
      const amountInCents = toCents(amount);
      await storage.updateUserBalance(req.user.id, amountInCents);

      // Create transaction record
      await storage.createTransaction({
        userId: req.user.id,
        amount: amountInCents,
        currency: "USD",
        status: "completed",
        type: "deposit",
        paypalTransactionId: payment.id,
        createdAt: new Date(),
      });

      res.json({ success: true, payment });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/billing/transactions", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const transactions = await storage.getTransactionsByUser(req.user.id);
    res.json(transactions);
  });

  // Support Ticket Routes
  app.get("/api/tickets", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const tickets = await storage.getTicketsByUser(req.user.id);
    res.json(tickets);
  });

  app.post("/api/tickets", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const parsed = insertTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      // If serverId is provided, check if the server exists and belongs to the user
      if (parsed.data.serverId) {
        const server = await storage.getServer(parsed.data.serverId);
        if (!server || server.userId !== req.user.id) {
          return res.status(404).json({ message: "Server not found" });
        }

        // Check if user already has an open ticket for this server
        const existingTickets = await storage.getTicketsByUser(req.user.id);
        const hasOpenTicket = existingTickets.some(
          ticket => ticket.serverId === parsed.data.serverId && ticket.status === 'open'
        );

        if (hasOpenTicket) {
          return res.status(400).json({
            message: "You already have an open ticket for this server"
          });
        }

        // Store the original droplet ID with the ticket
        const ticket = await storage.createTicket({
          userId: req.user.id,
          serverId: parsed.data.serverId,
          subject: parsed.data.subject,
          priority: parsed.data.priority, // Now guaranteed to be string due to schema default
          originalDropletId: server.dropletId,
          status: 'open'
        });

        // Create initial message
        await storage.createMessage({
          ticketId: ticket.id,
          userId: req.user.id,
          message: parsed.data.message,
        });

        res.status(201).json(ticket);
      } else {
        // Create ticket without server association
        const ticket = await storage.createTicket({
          userId: req.user.id,
          subject: parsed.data.subject,
          priority: parsed.data.priority, // Now guaranteed to be string due to schema default
          status: 'open',
          serverId: null,
          originalDropletId: null
        });

        await storage.createMessage({
          ticketId: ticket.id,
          userId: req.user.id,
          message: parsed.data.message,
        });

        res.status(201).json(ticket);
      }
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/tickets/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket || (ticket.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    const messages = await storage.getMessagesByTicket(ticket.id);
    res.json({ ticket, messages });
  });

  app.post("/api/tickets/:id/messages", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket || (ticket.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    const parsed = insertMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const message = await storage.createMessage({
      ticketId: ticket.id,
      userId: req.user.id,
      message: parsed.data.message,
    });

    // Update ticket's updated_at timestamp
    if (ticket.status === 'closed') {
      await storage.updateTicketStatus(ticket.id, 'open');
    }

    res.status(201).json(message);
  });

  app.patch("/api/tickets/:id/status", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket || (ticket.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    const { status } = req.body;
    if (!status || !["open", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedTicket = await storage.updateTicketStatus(ticket.id, status);
    res.json(updatedTicket);
  });
  
  // Add route to delete tickets (admin only)
  app.delete("/api/tickets/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    // Check if user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Only administrators can delete tickets" });
    }

    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket) {
      return res.sendStatus(404);
    }

    // Delete all messages for the ticket first
    const messages = await storage.getMessagesByTicket(ticket.id);
    for (const message of messages) {
      await storage.deleteMessage(message.id);
    }

    // Then delete the ticket
    await storage.deleteTicket(ticket.id);
    res.sendStatus(204);
  });

  app.patch("/api/tickets/:id/messages/:messageId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket || (ticket.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    const messages = await storage.getMessagesByTicket(ticket.id);
    const message = messages.find(m => m.id === parseInt(req.params.messageId));

    if (!message || (message.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    // Check if message is within 10-minute edit window
    const createdAt = new Date(message.createdAt);
    const now = new Date();
    const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffInMinutes > 10) {
      return res.status(400).json({ message: "Message can no longer be edited" });
    }

    const { message: newMessage } = req.body;
    if (!newMessage || typeof newMessage !== "string") {
      return res.status(400).json({ message: "Invalid message" });
    }

    const updatedMessage = await storage.updateMessage(message.id, { message: newMessage });
    res.json(updatedMessage);
  });


  // Server Action Routes
  app.post("/api/servers/:id/actions/reboot", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    try {
      // Call the DigitalOcean client to reboot the droplet
      await digitalOcean.performDropletAction(server.dropletId, "reboot");
      
      // Update server status
      const updatedServer = await storage.updateServer(server.id, { status: "rebooting" });
      
      // After a short delay, set the status back to active
      setTimeout(async () => {
        try {
          await storage.updateServer(server.id, { status: "active" });
        } catch (error) {
          console.error("Failed to update server status after reboot:", error);
        }
      }, 5000);
      
      res.json(updatedServer);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/servers/:id/actions/:action", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    const action = req.params.action;
    if (action !== "start" && action !== "stop") {
      return res.status(400).json({ message: "Invalid action" });
    }

    try {
      // Determine the DO API action and new status
      const doAction = action === "start" ? "power_on" : "power_off";
      const newStatus = action === "start" ? "active" : "off";
      const transitionStatus = action === "start" ? "starting" : "stopping";
      
      // Call DigitalOcean API
      await digitalOcean.performDropletAction(server.dropletId, doAction as any);
      
      // Update server status to transition state first
      let updatedServer = await storage.updateServer(server.id, { status: transitionStatus });
      
      // After a short delay, update to final state
      setTimeout(async () => {
        try {
          await storage.updateServer(server.id, { status: newStatus });
        } catch (error) {
          console.error(`Failed to update server status after ${action}:`, error);
        }
      }, 5000);
      
      res.json(updatedServer);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/servers/:id/password", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    try {
      // In a real implementation, this would reset the server's root password
      // For now we'll just simulate success
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/servers/:id/ipv6", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const server = await storage.getServer(parseInt(req.params.id));
    if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "Enabled status must be a boolean" });
    }

    try {
      let ipv6Address = null;
      
      // Only need to call the API if enabling IPv6
      if (enabled) {
        // Call DigitalOcean API to enable IPv6
        await digitalOcean.performDropletAction(server.dropletId, "enable_ipv6");
        
        // Generate a fake IPv6 address - in a real implementation this would be retrieved from the API
        ipv6Address = "2001:db8:85a3:8d3:1319:8a2e:370:7348";
      }
      
      // Update the server record with the new IPv6 address (or null)
      const updatedServer = await storage.updateServer(server.id, { ipv6Address });
      res.json(updatedServer);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // SSH Key Routes
  app.get("/api/ssh-keys", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const keys = await storage.getSSHKeysByUser(req.user.id);
    res.json(keys);
  });

  app.post("/api/ssh-keys", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const { name, publicKey } = req.body;
    if (!name || !publicKey) {
      return res.status(400).json({ message: "Name and public key are required" });
    }

    try {
      const key = await storage.createSSHKey({
        userId: req.user.id,
        name,
        publicKey,
        createdAt: new Date(),
      });
      res.status(201).json(key);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/ssh-keys/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const keyId = parseInt(req.params.id);
    const key = await storage.getSSHKey(keyId);

    if (!key || (key.userId !== req.user.id && !req.user.isAdmin)) {
      return res.sendStatus(404);
    }

    await storage.deleteSSHKey(keyId);
    res.sendStatus(204);
  });

  // Account Update Route
  app.patch("/api/account", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const { username, currentPassword, newPassword } = req.body;
    if (!username || !currentPassword) {
      return res.status(400).json({ message: "Username and current password are required" });
    }

    try {
      const user = await storage.updateUser(req.user.id, {
        username,
        password: newPassword || currentPassword,
      });
      res.json({ username: user.username });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Server Metrics Routes
  // Get the latest metrics for a server
  app.get("/api/servers/:id/metrics/latest", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      
      if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
        return res.sendStatus(404);
      }

      // Get the latest metric from the database
      const latestMetric = await storage.getLatestServerMetric(serverId);

      if (!latestMetric) {
        // If no metrics exist, fetch from DigitalOcean and create a new one
        const doMetrics = await digitalOcean.getServerMetrics(server.dropletId);
        
        // Convert to our metric format
        const newMetric = {
          serverId,
          cpuUsage: Math.round(doMetrics.cpu),
          memoryUsage: Math.round(doMetrics.memory),
          diskUsage: Math.round(doMetrics.disk),
          networkIn: doMetrics.network_in,
          networkOut: doMetrics.network_out,
          loadAverage: doMetrics.load_average,
          uptimeSeconds: doMetrics.uptime_seconds,
          timestamp: new Date()
        };
        
        // Store the metric
        const savedMetric = await storage.createServerMetric(newMetric);
        
        // Update the server's last monitored timestamp
        await storage.updateServer(serverId, { 
          lastMonitored: savedMetric.timestamp 
        });
        
        return res.json(savedMetric);
      }
      
      // Check if we need to refresh the metrics (if older than 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (latestMetric.timestamp < fiveMinutesAgo) {
        // Fetch fresh metrics from DigitalOcean
        const doMetrics = await digitalOcean.getServerMetrics(server.dropletId);
        
        // Convert to our metric format and save
        const newMetric = {
          serverId,
          cpuUsage: Math.round(doMetrics.cpu),
          memoryUsage: Math.round(doMetrics.memory),
          diskUsage: Math.round(doMetrics.disk),
          networkIn: doMetrics.network_in,
          networkOut: doMetrics.network_out,
          loadAverage: doMetrics.load_average,
          uptimeSeconds: doMetrics.uptime_seconds,
          timestamp: new Date()
        };
        
        // Store the metric
        const savedMetric = await storage.createServerMetric(newMetric);
        
        // Update the server's last monitored timestamp
        await storage.updateServer(serverId, { 
          lastMonitored: savedMetric.timestamp 
        });
        
        return res.json(savedMetric);
      }
      
      // Return the latest metric
      return res.json(latestMetric);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get historical metrics for a server
  app.get("/api/servers/:id/metrics/history", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      
      if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
        return res.sendStatus(404);
      }

      // Get limit from query parameters, default to 24
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 24;
      
      // Get metrics history
      const metrics = await storage.getServerMetricHistory(serverId, limit);
      
      return res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Force refresh metrics for a server
  app.post("/api/servers/:id/metrics/refresh", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const serverId = parseInt(req.params.id);
      const server = await storage.getServer(serverId);
      
      if (!server || (server.userId !== req.user.id && !req.user.isAdmin)) {
        return res.sendStatus(404);
      }

      // Fetch fresh metrics from DigitalOcean
      const doMetrics = await digitalOcean.getServerMetrics(server.dropletId);
      
      // Convert to our metric format and save
      const newMetric = {
        serverId,
        cpuUsage: Math.round(doMetrics.cpu),
        memoryUsage: Math.round(doMetrics.memory),
        diskUsage: Math.round(doMetrics.disk),
        networkIn: doMetrics.network_in,
        networkOut: doMetrics.network_out,
        loadAverage: doMetrics.load_average,
        uptimeSeconds: doMetrics.uptime_seconds,
        timestamp: new Date()
      };
      
      // Store the metric
      const savedMetric = await storage.createServerMetric(newMetric);
      
      // Update the server's last monitored timestamp
      await storage.updateServer(serverId, { 
        lastMonitored: savedMetric.timestamp 
      });
      
      return res.json(savedMetric);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}