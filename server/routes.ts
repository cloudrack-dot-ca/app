import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSectionSchema, insertArticleSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Documentation section routes
  app.get("/api/docs/sections", async (_req, res) => {
    const sections = await storage.getSections();
    res.json(sections);
  });

  app.post("/api/docs/sections", async (req, res) => {
    const result = insertSectionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const section = await storage.createSection(result.data);
    res.json(section);
  });

  app.patch("/api/docs/sections/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const result = insertSectionSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const section = await storage.updateSection(id, result.data);
    res.json(section);
  });

  app.delete("/api/docs/sections/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteSection(id);
    res.status(204).end();
  });

  // Documentation article routes
  app.get("/api/docs/sections/:sectionId/articles", async (req, res) => {
    const sectionId = parseInt(req.params.sectionId);
    const articles = await storage.getArticles(sectionId);
    res.json(articles);
  });

  app.post("/api/docs/articles", async (req, res) => {
    const result = insertArticleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const article = await storage.createArticle(result.data);
    res.json(article);
  });

  app.patch("/api/docs/articles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const result = insertArticleSchema.partial().safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const article = await storage.updateArticle(id, result.data);
    res.json(article);
  });

  app.delete("/api/docs/articles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteArticle(id);
    res.status(204).end();
  });

  const httpServer = createServer(app);
  return httpServer;
}
