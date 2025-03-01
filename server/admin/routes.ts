import { Request, Response, NextFunction, Express } from 'express';
import { storage } from '../storage';
import { Server, User, SupportTicket, BillingTransaction } from '@shared/schema';
import { log } from '../vite';

// Admin middleware to check if user is an admin
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}

export function registerAdminRoutes(app: Express) {
  // Apply admin middleware to all admin routes
  app.use('/api/admin', adminMiddleware);
  
  // Get admin statistics
  app.get('/api/admin/stats', async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const servers = await storage.getAllServers();
      const tickets = await storage.getAllTickets();
      const transactions = await storage.getAllTransactions();
      
      // Calculate total deposits (converts cents to dollars)
      const totalDeposits = transactions
        .filter((tx: BillingTransaction) => tx.type === 'deposit' && tx.status === 'completed')
        .reduce((sum: number, tx: BillingTransaction) => sum + tx.amount, 0) / 100; // Convert cents to dollars
      
      // Calculate total spending
      const totalSpending = transactions
        .filter((tx: BillingTransaction) => tx.type === 'charge' && tx.status === 'completed')
        .reduce((sum: number, tx: BillingTransaction) => sum + tx.amount, 0) / 100; // Convert cents to dollars
      
      // Calculate servers by region
      const serversByRegion = servers.reduce((acc: Record<string, number>, server: Server) => {
        acc[server.region] = (acc[server.region] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate servers by size
      const serversBySize = servers.reduce((acc: Record<string, number>, server: Server) => {
        acc[server.size] = (acc[server.size] || 0) + 1;
        return acc;
      }, {});
      
      const stats = {
        users: {
          total: users.length,
          active: users.length, // We don't have an active status for users yet
          admins: users.filter((user: User) => user.isAdmin).length
        },
        servers: {
          total: servers.length,
          active: servers.filter((server: Server) => server.status === 'active').length,
          byRegion: serversByRegion,
          bySize: serversBySize
        },
        tickets: {
          total: tickets.length,
          open: tickets.filter((ticket: SupportTicket) => ticket.status === 'open').length,
          closed: tickets.filter((ticket: SupportTicket) => ticket.status === 'closed').length,
          critical: tickets.filter((ticket: SupportTicket) => ticket.priority === 'critical').length
        },
        billing: {
          totalDeposits,
          totalSpending
        }
      };
      
      res.json(stats);
    } catch (error) {
      log(`Admin stats error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load admin statistics' });
    }
  });
  
  // Get all users
  app.get('/api/admin/users', async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      log(`Admin users error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load users' });
    }
  });
  
  // Update user balance
  app.patch('/api/admin/users/:id/balance', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { amount } = req.body;
      
      // Validate input
      if (isNaN(userId) || !amount || isNaN(amount)) {
        return res.status(400).json({ message: 'Invalid user ID or amount' });
      }
      
      // Get user to check if exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Set the user's balance directly to the specified amount
      const updatedUser = await storage.updateUser(userId, {
        balance: amount
      });
      
      // Create a transaction record
      const prevBalance = user.balance;
      const amountDifference = amount - prevBalance;
      
      if (amountDifference !== 0) {
        const transactionType = amountDifference > 0 ? 'deposit' : 'charge';
        const absAmount = Math.abs(amountDifference);
        
        await storage.createTransaction({
          userId,
          amount: absAmount,
          type: transactionType,
          status: 'completed',
          currency: 'USD',
          paypalTransactionId: null,
          createdAt: new Date(),
          description: `Admin adjustment: ${amountDifference > 0 ? 'Added' : 'Deducted'} ${absAmount/100} USD`
        });
      }
      
      res.json(updatedUser);
    } catch (error) {
      log(`Admin update user balance error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to update user balance' });
    }
  });
  
  // Get all servers
  app.get('/api/admin/servers', async (req: Request, res: Response) => {
    try {
      const servers = await storage.getAllServers();
      res.json(servers);
    } catch (error) {
      log(`Admin servers error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load servers' });
    }
  });
  
  // Get all tickets
  app.get('/api/admin/tickets', async (req: Request, res: Response) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error) {
      log(`Admin tickets error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load tickets' });
    }
  });
  
  // Get all transactions
  app.get('/api/admin/transactions', async (req: Request, res: Response) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      log(`Admin transactions error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load transactions' });
    }
  });
  
  // Get all IP bans
  app.get('/api/admin/ip-bans', async (req: Request, res: Response) => {
    try {
      const ipBans = await storage.getAllIPBans();
      res.json(ipBans);
    } catch (error) {
      log(`Admin IP bans error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to load IP bans' });
    }
  });
  
  // Create IP ban
  app.post('/api/admin/ip-bans', async (req: Request, res: Response) => {
    try {
      const { ipAddress, reason, expiresAt } = req.body;
      
      // Validate input
      if (!ipAddress || !reason) {
        return res.status(400).json({ message: 'IP address and reason are required' });
      }
      
      // Check if IP is already banned
      const existingBan = await storage.getIPBan(ipAddress);
      if (existingBan) {
        return res.status(409).json({ message: 'IP address is already banned' });
      }
      
      // Create the ban
      const ipBan = await storage.createIPBan({
        ipAddress,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        bannedBy: req.user!.id,
        isActive: true
      });
      
      res.status(201).json(ipBan);
    } catch (error) {
      log(`Admin create IP ban error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to create IP ban' });
    }
  });
  
  // Delete IP ban
  app.delete('/api/admin/ip-bans/:id', async (req: Request, res: Response) => {
    try {
      const banId = parseInt(req.params.id);
      
      // Validate input
      if (isNaN(banId)) {
        return res.status(400).json({ message: 'Invalid ban ID' });
      }
      
      await storage.deleteIPBan(banId);
      res.status(204).send();
    } catch (error) {
      log(`Admin delete IP ban error: ${error}`, 'admin');
      res.status(500).json({ message: 'Failed to delete IP ban' });
    }
  });
  
  // Log that routes were registered
  log('Admin routes registered', 'admin');
}