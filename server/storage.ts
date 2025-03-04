import { users, siteSettings, type User, type InsertUser, type SiteSettings, type UpdateSiteSettings } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private settings: SiteSettings;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.settings = {
      id: 1,
      maintenanceMode: false,
      maintenanceMessage: "We're currently performing maintenance. Please check back soon.",
      comingSoonMode: false,
      comingSoonMessage: "This feature is coming soon. Stay tuned for updates!"
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

  async getSiteSettings(): Promise<SiteSettings> {
    return this.settings;
  }

  async updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings> {
    this.settings = {
      ...this.settings,
      ...settings
    };
    return this.settings;
  }
}

export const storage = new MemStorage();
