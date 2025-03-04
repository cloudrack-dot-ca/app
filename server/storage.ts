import { articles, sections, users, type User, type InsertUser, type Section, type InsertSection, type Article, type InsertArticle } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Documentation methods
  getSections(): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;
  deleteSection(id: number): Promise<void>;

  getArticles(sectionId: number): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  deleteArticle(id: number): Promise<void>;
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

  async getSections(): Promise<Section[]> {
    return await db.select().from(sections).orderBy(sections.createdAt);
  }

  async createSection(section: InsertSection): Promise<Section> {
    const [newSection] = await db.insert(sections).values(section).returning();
    return newSection;
  }

  async deleteSection(id: number): Promise<void> {
    await db.delete(sections).where(eq(sections.id, id));
  }

  async getArticles(sectionId: number): Promise<Article[]> {
    return await db.select().from(articles).where(eq(articles.sectionId, sectionId));
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  async deleteArticle(id: number): Promise<void> {
    await db.delete(articles).where(eq(articles.id, id));
  }
}

export const storage = new DatabaseStorage();