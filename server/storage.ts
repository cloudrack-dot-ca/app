import { users, servers, volumes, billingTransactions, supportTickets, supportMessages, type User, type Server, type Volume, type InsertUser, type BillingTransaction, type SupportTicket, type SupportMessage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { sql } from 'drizzle-orm';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>;

  getServer(id: number): Promise<Server | undefined>;
  getServersByUser(userId: number): Promise<Server[]>;
  createServer(server: Omit<Server, "id">): Promise<Server>;
  updateServer(id: number, updates: Partial<Server>): Promise<Server>;
  deleteServer(id: number): Promise<void>;

  getVolume(id: number): Promise<Volume | undefined>;
  getVolumesByServer(serverId: number): Promise<Volume[]>;
  createVolume(volume: Omit<Volume, "id">): Promise<Volume>;
  deleteVolume(id: number): Promise<void>;

  createTransaction(transaction: Omit<BillingTransaction, "id">): Promise<BillingTransaction>;
  getTransactionsByUser(userId: number): Promise<BillingTransaction[]>;

  createTicket(ticket: Omit<SupportTicket, "id" | "createdAt" | "updatedAt">): Promise<SupportTicket>;
  getTicket(id: number): Promise<SupportTicket | undefined>;
  getTicketsByUser(userId: number): Promise<SupportTicket[]>;
  getAllTickets(): Promise<SupportTicket[]>; 
  updateTicketStatus(id: number, status: string): Promise<SupportTicket>;
  updateTicketPriority(id: number, priority: string): Promise<SupportTicket>;

  createMessage(message: Omit<SupportMessage, "id" | "createdAt">): Promise<SupportMessage>;
  getMessagesByTicket(ticketId: number): Promise<SupportMessage[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ balance: sql`balance + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getServer(id: number): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }

  async getServersByUser(userId: number): Promise<Server[]> {
    return await db.select().from(servers).where(eq(servers.userId, userId));
  }

  async createServer(server: Omit<Server, "id">): Promise<Server> {
    const [newServer] = await db.insert(servers).values(server).returning();
    return newServer;
  }

  async getAllServers(): Promise<Server[]> {
    return await db.select().from(servers);
  }

  async updateServer(id: number, updates: Partial<Server>): Promise<Server> {
    const [updatedServer] = await db
      .update(servers)
      .set(updates)
      .where(eq(servers.id, id))
      .returning();
    return updatedServer;
  }

  async deleteServer(id: number): Promise<void> {
    await db.delete(servers).where(eq(servers.id, id));
  }

  async getVolume(id: number): Promise<Volume | undefined> {
    const [volume] = await db.select().from(volumes).where(eq(volumes.id, id));
    return volume;
  }

  async getVolumesByServer(serverId: number): Promise<Volume[]> {
    return await db.select().from(volumes).where(eq(volumes.serverId, serverId));
  }

  async createVolume(volume: Omit<Volume, "id">): Promise<Volume> {
    const [newVolume] = await db.insert(volumes).values(volume).returning();
    return newVolume;
  }

  async deleteVolume(id: number): Promise<void> {
    await db.delete(volumes).where(eq(volumes.id, id));
  }

  async createTransaction(transaction: Omit<BillingTransaction, "id">): Promise<BillingTransaction> {
    const [newTransaction] = await db.insert(billingTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getTransactionsByUser(userId: number): Promise<BillingTransaction[]> {
    return await db
      .select()
      .from(billingTransactions)
      .where(eq(billingTransactions.userId, userId))
      .orderBy(billingTransactions.createdAt);
  }

  async createTicket(ticket: Omit<SupportTicket, "id" | "createdAt" | "updatedAt">): Promise<SupportTicket> {
    const [newTicket] = await db.insert(supportTickets)
      .values({
        ...ticket,
        status: 'open', 
      })
      .returning();
    return newTicket;
  }

  async getTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket;
  }

  async getTicketsByUser(userId: number): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .orderBy(sql`${supportTickets.updatedAt} DESC`);
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    return await db.select()
      .from(supportTickets)
      .orderBy(sql`${supportTickets.updatedAt} DESC`);
  }

  async updateTicketStatus(id: number, status: string): Promise<SupportTicket> {
    const [updatedTicket] = await db.update(supportTickets)
      .set({ 
        status,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket;
  }

  async updateTicketPriority(id: number, priority: string): Promise<SupportTicket> {
    const [updatedTicket] = await db.update(supportTickets)
      .set({ 
        priority,
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket;
  }

  async createMessage(message: Omit<SupportMessage, "id" | "createdAt">): Promise<SupportMessage> {
    const [newMessage] = await db.insert(supportMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessagesByTicket(ticketId: number): Promise<SupportMessage[]> {
    return await db.select()
      .from(supportMessages)
      .where(eq(supportMessages.ticketId, ticketId))
      .orderBy(sql`${supportMessages.createdAt} ASC`);
  }
}

export const storage = new DatabaseStorage();