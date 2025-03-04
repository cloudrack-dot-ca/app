import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  users, documentationSections, documentationArticles,
  type User, type InsertUser,
  type Section, type InsertSection,
  type Article, type InsertArticle,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Documentation section methods
  getSections(): Promise<Section[]>;
  getSection(id: number): Promise<Section | undefined>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: number, section: Partial<InsertSection>): Promise<Section>;
  deleteSection(id: number): Promise<void>;

  // Documentation article methods
  getArticles(sectionId: number): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article>;
  deleteArticle(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
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

  // Documentation section methods
  async getSections(): Promise<Section[]> {
    return db.select().from(documentationSections).orderBy(documentationSections.order);
  }

  async getSection(id: number): Promise<Section | undefined> {
    const [section] = await db
      .select()
      .from(documentationSections)
      .where(eq(documentationSections.id, id));
    return section;
  }

  async createSection(section: InsertSection): Promise<Section> {
    const [newSection] = await db
      .insert(documentationSections)
      .values(section)
      .returning();
    return newSection;
  }

  async updateSection(id: number, section: Partial<InsertSection>): Promise<Section> {
    const [updatedSection] = await db
      .update(documentationSections)
      .set(section)
      .where(eq(documentationSections.id, id))
      .returning();
    return updatedSection;
  }

  async deleteSection(id: number): Promise<void> {
    await db.delete(documentationSections).where(eq(documentationSections.id, id));
  }

  // Documentation article methods
  async getArticles(sectionId: number): Promise<Article[]> {
    return db
      .select()
      .from(documentationArticles)
      .where(eq(documentationArticles.sectionId, sectionId))
      .orderBy(documentationArticles.order);
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db
      .select()
      .from(documentationArticles)
      .where(eq(documentationArticles.id, id));
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db
      .insert(documentationArticles)
      .values(article)
      .returning();
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article> {
    const [updatedArticle] = await db
      .update(documentationArticles)
      .set(article)
      .where(eq(documentationArticles.id, id))
      .returning();
    return updatedArticle;
  }

  async deleteArticle(id: number): Promise<void> {
    await db.delete(documentationArticles).where(eq(documentationArticles.id, id));
  }
}

export const storage = new DatabaseStorage();
