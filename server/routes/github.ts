import express from "express";
import { getGitHubOAuthURL, exchangeCodeForToken, saveGitHubToken, getUserRepositories } from "../services/github";
import { requireAuth } from "../auth";

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
    const url = await getGitHubOAuthURL();
    console.log("Generated GitHub OAuth URL:", url); // Add logging
    res.json({ url });
  } catch (error) {
    console.error("Error generating GitHub OAuth URL:", error);
    res.status(500).json({ error: error.message });
  }
});

// Handle OAuth callback
router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Invalid code" });
    }

    const token = await exchangeCodeForToken(code);

    if (!token) {
      return res.status(400).json({ error: "Failed to obtain token" });
    }

    // If the user is logged in, associate the token with their account
    if (req.user) {
      await saveGitHubToken(req.user.id, token);
    } else {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Redirect to account page
    res.redirect("/account#github");
  } catch (error) {
    console.error("GitHub callback error:", error);
    res.status(500).json({ error: error.message });
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
