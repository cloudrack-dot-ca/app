import { Express, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { BillingTransaction, IPBan, Server, SupportTicket, User } from '../../shared/schema';

// Admin middleware to check if user is an admin
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  next();
}

export function registerAdminRoutes(app: Express) {
  // Get all users (admin only)
  app.get("/api/admin/users", adminMiddleware, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get all servers (admin only)
  app.get("/api/admin/servers", adminMiddleware, async (req, res) => {
    try {
      const servers = await storage.getAllServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get all tickets (admin only)
  app.get("/api/admin/tickets", adminMiddleware, async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Update ticket priority (admin only)
  app.patch("/api/admin/tickets/:id/priority", adminMiddleware, async (req, res) => {
    try {
      const ticket = await storage.getTicket(parseInt(req.params.id));
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const { priority } = req.body;
      if (!priority || !["low", "medium", "high", "critical"].includes(priority)) {
        return res.status(400).json({ message: "Invalid priority" });
      }

      const updatedTicket = await storage.updateTicketPriority(ticket.id, priority);
      res.json(updatedTicket);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Update user (admin only)
  app.patch("/api/admin/users/:id", adminMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates = req.body;
      // Prevent changing username and password through this route
      delete updates.username;
      delete updates.password;

      const updatedUser = await storage.updateUser(user.id, updates);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Adjust user balance (admin only)
  app.post("/api/admin/users/:id/balance", adminMiddleware, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { amount, reason } = req.body;
      if (typeof amount !== "number") {
        return res.status(400).json({ message: "Amount must be a number" });
      }

      // Update user balance
      const updatedUser = await storage.updateUserBalance(user.id, amount);

      // Record the transaction
      await storage.createTransaction({
        userId: user.id,
        amount,
        currency: "USD",
        status: "completed",
        type: "admin_adjustment",
        paypalTransactionId: null,
        createdAt: new Date()
        // Remove the 'note' field as it's not in the schema
      });

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Get IP bans (admin only)
  app.get("/api/admin/ip-bans", adminMiddleware, async (req, res) => {
    try {
      const bans = await storage.getAllIPBans();
      res.json(bans);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Create IP ban (admin only)
  app.post("/api/admin/ip-bans", adminMiddleware, async (req, res) => {
    try {
      const { ipAddress, reason, expiresAt } = req.body;
      
      if (!ipAddress) {
        return res.status(400).json({ message: "IP address is required" });
      }

      // Check if the IP is already banned
      const existingBan = await storage.getIPBan(ipAddress);
      if (existingBan) {
        return res.status(400).json({ message: "This IP address is already banned" });
      }

      const ban = await storage.createIPBan({
        ipAddress,
        reason: reason || "Security measure",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        bannedBy: req.user!.id,  // Add the admin ID who created the ban
        isActive: true // Default to active
      });

      res.status(201).json(ban);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Delete IP ban (admin only)
  app.delete("/api/admin/ip-bans/:id", adminMiddleware, async (req, res) => {
    try {
      const banId = parseInt(req.params.id);
      await storage.deleteIPBan(banId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Return metrics about system (admin only)
  app.get("/api/admin/metrics", adminMiddleware, async (req, res) => {
    try {
      // Get counts of key entities
      const servers = await storage.getAllServers();
      const tickets = await storage.getAllTickets();
      const users = await storage.getAllUsers();
      const openTickets = tickets.filter(ticket => ticket.status === 'open');
      
      // Calculate revenue data
      const transactions = await storage.getAllTransactions();
      const revenueTotal = transactions
        .filter((tx: BillingTransaction) => tx.type === 'deposit' && tx.status === 'completed')
        .reduce((sum: number, tx: BillingTransaction) => sum + tx.amount, 0) / 100; // Convert cents to dollars
      
      // Server stats
      const serversByRegion = servers.reduce((acc: Record<string, number>, server: Server) => {
        acc[server.region] = (acc[server.region] || 0) + 1;
        return acc;
      }, {});
      
      const serversBySize = servers.reduce((acc: Record<string, number>, server: Server) => {
        acc[server.size] = (acc[server.size] || 0) + 1;
        return acc;
      }, {});

      // Return the metrics
      res.json({
        users: {
          total: users.length,
          admins: users.filter((user: User) => user.isAdmin).length
        },
        servers: {
          total: servers.length,
          byRegion: serversByRegion,
          bySize: serversBySize,
          active: servers.filter((server: Server) => server.status === 'active').length
        },
        tickets: {
          total: tickets.length,
          open: openTickets.length,
          critical: tickets.filter((ticket: SupportTicket) => ticket.priority === 'critical').length
        },
        financial: {
          totalRevenue: revenueTotal,
          transactionCount: transactions.length
        }
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
}