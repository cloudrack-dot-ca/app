import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSectionSchema, insertArticleSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/sections", async (_req, res) => {
    try {
      const sections = await storage.getSections();
      res.json(sections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sections" });
    }
  });

  app.post("/api/sections", async (req, res) => {
    try {
      const parsed = insertSectionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid section data" });
      }
      const section = await storage.createSection(parsed.data);
      res.json(section);
    } catch (error) {
      res.status(500).json({ message: "Failed to create section" });
    }
  });

  app.delete("/api/sections/:id", async (req, res) => {
    try {
      await storage.deleteSection(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete section" });
    }
  });

  app.get("/api/sections/:id/articles", async (req, res) => {
    try {
      const articles = await storage.getArticles(Number(req.params.id));
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    try {
      const parsed = insertArticleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid article data" });
      }
      const article = await storage.createArticle(parsed.data);
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    try {
      await storage.deleteArticle(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
