import { users, servers, volumes, type User, type Server, type Volume, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getServer(id: number): Promise<Server | undefined>;
  getServersByUser(userId: number): Promise<Server[]>;
  createServer(server: Omit<Server, "id">): Promise<Server>;
  updateServer(id: number, updates: Partial<Server>): Promise<Server>;
  deleteServer(id: number): Promise<void>;

  getVolume(id: number): Promise<Volume | undefined>;
  getVolumesByServer(serverId: number): Promise<Volume[]>;
  createVolume(volume: Omit<Volume, "id">): Promise<Volume>;
  deleteVolume(id: number): Promise<void>;

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
}

export const storage = new DatabaseStorage();