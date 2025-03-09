import express from "express";
import { getGitHubOAuthURL, exchangeCodeForToken, saveGitHubToken, getUserRepositories } from "../services/github";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import fetch from "node-fetch";

const router = express.Router();

// Authentication required for most GitHub routes
router.use("/repos", requireAuth);
router.use("/auth-url", requireAuth);
router.use("/disconnect", requireAuth);

// Routes
router.get("/repos", async (req, res) => {
  try {
    const githubToken = req.user.githubToken;

    if (!githubToken) {
      return res.status(401).json({ error: "GitHub account not connected" });
    }

    const repos = await getUserRepositories(githubToken);
    res.json(repos);
  } catch (error) {
    console.error("GitHub repositories fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get GitHub OAuth URL
router.get("/auth-url", async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({ error: "GitHub OAuth configuration is missing" });
    }

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user:email`;

    res.json({ url: authUrl });
  } catch (error) {
    logger.error("Error generating GitHub auth URL:", error);
    res.status(500).json({ error: "Failed to generate GitHub auth URL" });
  }
});

// Handle OAuth callback
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "Missing code parameter" });
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({ error: "GitHub OAuth configuration is missing" });
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(500).json({ error: "Failed to obtain access token" });
    }

    const accessToken = tokenData.access_token;

    // Fetch user information from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `token ${accessToken}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    const userData = await userResponse.json();

    if (!userData.id) {
      return res.status(500).json({ error: "Failed to fetch user information from GitHub" });
    }

    // Save GitHub token and user information in the database
    await db.update(users)
      .set({
        githubToken: accessToken,
        githubUsername: userData.login,
        githubUserId: userData.id,
        githubConnectedAt: new Date().toISOString()
      })
      .where(eq(users.id, req.user.id));

    res.redirect("/dashboard");
  } catch (error) {
    logger.error("Error handling GitHub OAuth callback:", error);
    res.status(500).json({ error: "Failed to handle GitHub OAuth callback" });
  }
});

// Disconnect GitHub account
router.post("/disconnect", async (req, res) => {
  try {
    await saveGitHubToken(req.user.id, null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
