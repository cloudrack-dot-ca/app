import { users, maintenanceSettings, type User, type InsertUser, type MaintenanceSettings, type InsertMaintenanceSettings } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMaintenanceSettings(): Promise<MaintenanceSettings>;
  updateMaintenanceSettings(settings: Partial<InsertMaintenanceSettings>): Promise<MaintenanceSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private maintenance: MaintenanceSettings;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.maintenance = {
      id: 1,
      enabled: false,
      maintenanceMessage: "We're currently performing maintenance. Please check back soon.",
      comingSoonEnabled: false,
      comingSoonMessage: "This feature is coming soon. Stay tuned for updates!",
      updatedBy: null
    };
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

  async getMaintenanceSettings(): Promise<MaintenanceSettings> {
    return this.maintenance;
  }

  async updateMaintenanceSettings(settings: Partial<InsertMaintenanceSettings>): Promise<MaintenanceSettings> {
    this.maintenance = {
      ...this.maintenance,
      ...settings
    };
    return this.maintenance;
  }
}

export const storage = new MemStorage();
