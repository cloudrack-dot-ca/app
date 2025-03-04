import { users, siteSettings, type User, type InsertUser, type SiteSettings, type UpdateSiteSettings } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSiteSettings(): Promise<SiteSettings>;
  updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings>;
}

export class DatabaseStorage implements IStorage {
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

  async getSiteSettings(): Promise<SiteSettings> {
    const [settings] = await db.select().from(siteSettings);
    if (!settings) {
      // Create default settings if none exist
      const [newSettings] = await db.insert(siteSettings)
        .values({
          maintenanceMode: false,
          maintenanceMessage: "We're currently performing maintenance. Please check back soon.",
          comingSoonMode: false,
          comingSoonMessage: "This feature is coming soon. Stay tuned for updates!"
        })
        .returning();
      return newSettings;
    }
    return settings;
  }

  async updateSiteSettings(settings: UpdateSiteSettings): Promise<SiteSettings> {
    const [updatedSettings] = await db
      .update(siteSettings)
      .set(settings)
      .returning();
    return updatedSettings;
  }
}

export const storage = new DatabaseStorage();