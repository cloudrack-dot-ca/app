import { User, Server, Volume, InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private servers: Map<number, Server>;
  private volumes: Map<number, Volume>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.servers = new Map();
    this.volumes = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getServer(id: number): Promise<Server | undefined> {
    return this.servers.get(id);
  }

  async getServersByUser(userId: number): Promise<Server[]> {
    return Array.from(this.servers.values()).filter(
      (server) => server.userId === userId,
    );
  }

  async createServer(server: Omit<Server, "id">): Promise<Server> {
    const id = this.currentId++;
    const newServer: Server = { ...server, id };
    this.servers.set(id, newServer);
    return newServer;
  }

  async updateServer(id: number, updates: Partial<Server>): Promise<Server> {
    const server = await this.getServer(id);
    if (!server) throw new Error("Server not found");
    const updatedServer = { ...server, ...updates };
    this.servers.set(id, updatedServer);
    return updatedServer;
  }

  async deleteServer(id: number): Promise<void> {
    this.servers.delete(id);
  }

  async getVolume(id: number): Promise<Volume | undefined> {
    return this.volumes.get(id);
  }

  async getVolumesByServer(serverId: number): Promise<Volume[]> {
    return Array.from(this.volumes.values()).filter(
      (volume) => volume.serverId === serverId,
    );
  }

  async createVolume(volume: Omit<Volume, "id">): Promise<Volume> {
    const id = this.currentId++;
    const newVolume: Volume = { ...volume, id };
    this.volumes.set(id, newVolume);
    return newVolume;
  }

  async deleteVolume(id: number): Promise<void> {
    this.volumes.delete(id);
  }
}

export const storage = new MemStorage();
