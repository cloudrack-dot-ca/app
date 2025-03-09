import express from "express";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";
import { db } from "../db";
import { users } from "@shared/schema";
import { deployments } from "../db/schema";
import { eq } from "drizzle-orm";
import * as githubApi from "../services/github-api";
import * as appPlatform from "../services/app-platform";

const router = express.Router();

// Require authentication for all routes
router.use(requireAuth);

// Get all deployments for the authenticated user
router.get("/", async (req, res) => {
  try {
    logger.info(`Retrieving deployments for user ${req.user.id}`);

    const userDeployments = await db.query.deployments.findMany({
      where: eq(deployments.userId, req.user.id)
    });

    logger.info(`Retrieved ${userDeployments.length} deployments for user ${req.user.id}`);
    res.json(userDeployments);
  } catch (error) {
    logger.error("Error fetching deployments:", error);
    res.status(500).json({ error: "Failed to fetch deployments" });
  }
});

// Get deployment details by ID
router.get("/:id", async (req, res) => {
  try {
    const deployment = await db.query.deployments.findFirst({
      where: eq(deployments.id, parseInt(req.params.id))
    });

    if (!deployment || deployment.userId !== req.user.id) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    res.json(deployment);
  } catch (error) {
    logger.error("Error fetching deployment details:", error);
    res.status(500).json({ error: "Failed to fetch deployment details" });
  }
});

// Redeploy an existing deployment
router.post("/:id/redeploy", async (req, res) => {
  try {
    const deployment = await db.query.deployments.findFirst({
      where: eq(deployments.id, parseInt(req.params.id))
    });

    if (!deployment || deployment.userId !== req.user.id) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    // Trigger redeployment using app platform service
    await appPlatform.redeployApp(deployment);

    res.json({ success: true });
  } catch (error) {
    logger.error("Error redeploying application:", error);
    res.status(500).json({ error: "Failed to redeploy application" });
  }
});

// Restart an existing deployment
router.post("/:id/restart", async (req, res) => {
  try {
    const deployment = await db.query.deployments.findFirst({
      where: eq(deployments.id, parseInt(req.params.id))
    });

    if (!deployment || deployment.userId !== req.user.id) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    // Trigger restart using app platform service
    await appPlatform.restartApp(deployment);

    res.json({ success: true });
  } catch (error) {
    logger.error("Error restarting application:", error);
    res.status(500).json({ error: "Failed to restart application" });
  }
});

export default router;
