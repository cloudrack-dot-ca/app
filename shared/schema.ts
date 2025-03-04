import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  maintenanceMessage: text("maintenance_message").notNull().default("We're currently performing maintenance. Please check back soon."),
  comingSoonMode: boolean("coming_soon_mode").notNull().default(false),
  comingSoonMessage: text("coming_soon_message").notNull().default("This feature is coming soon. Stay tuned for updates!"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const updateSiteSettingsSchema = createInsertSchema(siteSettings).pick({
  maintenanceMode: true,
  maintenanceMessage: true,
  comingSoonMode: true,
  comingSoonMessage: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type UpdateSiteSettings = z.infer<typeof updateSiteSettingsSchema>;
