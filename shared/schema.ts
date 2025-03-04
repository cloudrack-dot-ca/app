import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sectionId: integer("section_id").references(() => sections.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sectionRelations = relations(sections, ({ many }) => ({
  articles: many(articles),
}));

export const articleRelations = relations(articles, ({ one }) => ({
  section: one(sections, {
    fields: [articles.sectionId],
    references: [sections.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSectionSchema = createInsertSchema(sections).pick({
  title: true,
});

export const insertArticleSchema = createInsertSchema(articles).pick({
  title: true,
  content: true,
  sectionId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof sections.$inferSelect;

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;
