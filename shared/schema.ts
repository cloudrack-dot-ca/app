import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const documentationSections = pgTable("documentation_sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
});

export const documentationArticles = pgTable("documentation_articles", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull().references(() => documentationSections.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  order: integer("order").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Relations
export const documentationSectionsRelations = relations(documentationSections, ({ many }) => ({
  articles: many(documentationArticles),
}));

export const documentationArticlesRelations = relations(documentationArticles, ({ one }) => ({
  section: one(documentationSections, {
    fields: [documentationArticles.sectionId],
    references: [documentationSections.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSectionSchema = createInsertSchema(documentationSections).pick({
  title: true,
  order: true,
});

export const insertArticleSchema = createInsertSchema(documentationArticles).pick({
  sectionId: true,
  title: true,
  content: true,
  order: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSection = z.infer<typeof insertSectionSchema>;
export type Section = typeof documentationSections.$inferSelect;

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof documentationArticles.$inferSelect;
