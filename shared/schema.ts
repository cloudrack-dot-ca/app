import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const maintenanceSettings = pgTable("maintenance_settings", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  maintenanceMessage: text("maintenance_message").notNull().default("We're currently performing maintenance. Please check back soon."),
  comingSoonEnabled: boolean("coming_soon_enabled").notNull().default(false),
  comingSoonMessage: text("coming_soon_message").notNull().default("This feature is coming soon. Stay tuned for updates!"),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const maintenanceSettingsSchema = createInsertSchema(maintenanceSettings).omit({
  id: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MaintenanceSettings = typeof maintenanceSettings.$inferSelect;
export type InsertMaintenanceSettings = z.infer<typeof maintenanceSettingsSchema>;
