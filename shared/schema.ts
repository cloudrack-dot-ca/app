import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
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

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planId: text("plan_id").notNull(),
  status: text("status").notNull(), // active, cancelled, expired
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  paypalSubscriptionId: text("paypal_subscription_id").notNull(),
});

export const billingTransactions = pgTable("billing_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull(),
  status: text("status").notNull(), // completed, pending, failed
  paypalTransactionId: text("paypal_transaction_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  planId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Server = typeof servers.$inferSelect;
export type Volume = typeof volumes.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type BillingTransaction = typeof billingTransactions.$inferSelect;