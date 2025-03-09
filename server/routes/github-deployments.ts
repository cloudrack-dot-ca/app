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

    // Use a direct query to the database instead of the query builder
    // since there seems to be an issue with the deployments query
    const userDeployments = await db.select()
      .from(deployments)
      .where(eq(deployments.userId, req.user.id));

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
    // Use direct query instead of the query builder
    const [deployment] = await db.select()
      .from(deployments)
      .where(eq(deployments.id, parseInt(req.params.id, 10)))
      .limit(1);

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
    // Use direct query instead of the query builder
    const [deployment] = await db.select()
      .from(deployments)
      .where(eq(deployments.id, parseInt(req.params.id, 10)))
      .limit(1);

    if (!deployment || deployment.userId !== req.user.id) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    logger.info(`Redeploying deployment ${deployment.id}`);

    // Trigger redeployment using app platform service
    await appPlatform.redeployApp(deployment);

    res.json({ message: "Deployment is redeploying" });
  } catch (error) {
    logger.error(`Error redeploying application: ${error}`);
    res.status(500).json({ error: "Failed to redeploy application" });
  }
});

// Restart an existing deployment
router.post("/:id/restart", async (req, res) => {
  try {
    // Use direct query instead of the query builder
    const [deployment] = await db.select()
      .from(deployments)
      .where(eq(deployments.id, parseInt(req.params.id, 10)))
      .limit(1);

    if (!deployment || deployment.userId !== req.user.id) {
      return res.status(404).json({ error: "Deployment not found" });
    }

    logger.info(`Restarting deployment ${deployment.id}`);

    // Trigger restart using app platform service
    await appPlatform.restartApp(deployment);

    res.json({ message: "Deployment is restarting" });
  } catch (error) {
    logger.error(`Error restarting deployment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to restart deployment" });
  }
});

export default router;
