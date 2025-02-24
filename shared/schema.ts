import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key"),
});

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  dropletId: text("droplet_id").notNull(),
  region: text("region").notNull(),
  size: text("size").notNull(),
  status: text("status").notNull(),
  ipAddress: text("ip_address"),
  specs: jsonb("specs").$type<{
    memory: number;
    vcpus: number;
    disk: number;
  }>(),
});

export const volumes = pgTable("volumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  serverId: integer("server_id").notNull(),
  name: text("name").notNull(),
  volumeId: text("volume_id").notNull(),
  size: integer("size").notNull(),
  region: text("region").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertServerSchema = createInsertSchema(servers).pick({
  name: true,
  region: true,
  size: true,
});

export const insertVolumeSchema = createInsertSchema(volumes).pick({
  name: true,
  size: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Server = typeof servers.$inferSelect;
export type Volume = typeof volumes.$inferSelect;
