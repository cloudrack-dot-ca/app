import express from "express";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";
import * as appPlatform from "../services/app-platform";

const router = express.Router();

// Require authentication for all routes
router.use(requireAuth);

// Get all deployments for the authenticated user
router.get("/", async (req, res) => {
  try {
    // Get all apps via the DigitalOcean API
    const apps = await appPlatform.getApps();

    // Format the apps into deployments
    const deployments = await Promise.all(apps.map(async (app) => {
      // For each app, get the active deployment details
      let deploymentInfo = {
        id: app.id,
        name: app.spec.name,
        repository: app.spec.services?.[0]?.github?.repo || "Unknown",
        branch: app.spec.services?.[0]?.github?.branch || "main",
        status: app.active_deployment?.phase?.toLowerCase() || "deploying",
        url: app.live_url,
        region: app.region?.slug || "",
        size: app.spec.services?.[0]?.instance_size_slug || "",
        createdAt: app.created_at,
        lastDeployedAt: app.active_deployment?.created_at || app.created_at
      };

      return deploymentInfo;
    }));

    logger.info(`Retrieved ${deployments.length} deployments for user ${req.user.id}`);
    res.json(deployments);
  } catch (error) {
    logger.error("Error fetching deployments:", error);
    res.status(500).json({ error: "Failed to fetch deployments" });
  }
});

// Get a specific deployment by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get the app details from DigitalOcean
    const app = await appPlatform.getApp(id);

    // Format the app into a deployment
    const deployment = {
      id: app.id,
      name: app.spec.name,
      repository: app.spec.services?.[0]?.github?.repo || "Unknown",
      branch: app.spec.services?.[0]?.github?.branch || "main",
      status: app.active_deployment?.phase?.toLowerCase() || "deploying",
      url: app.live_url,
      region: app.region?.slug || "",
      size: app.spec.services?.[0]?.instance_size_slug || "",
      createdAt: app.created_at,
      lastDeployedAt: app.active_deployment?.created_at || app.created_at,
      envVars: app.spec.services?.[0]?.envs?.reduce((acc, env) => {
        acc[env.key] = env.value;
        return acc;
      }, {})
    };

    res.json(deployment);
  } catch (error) {
    logger.error(`Error fetching deployment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch deployment details" });
  }
});

// Create a new deployment (new app)
router.post("/", async (req, res) => {
  try {
    const { repo, branch, name, region, size, env } = req.body;

    // Validate required fields
    if (!repo || !branch || !name || !region || !size) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    logger.info(`Creating new deployment for ${repo}:${branch} as ${name}`);

    // Create the app on DigitalOcean
    const app = await appPlatform.createAppFromGitHub(req.user.id, {
      name,
      repository: repo,
      branch,
      region,
      size,
      environmentVariables: env || {}
    });

    // Return the newly created app details
    const deployment = {
      id: app.id,
      name: app.spec.name,
      repository: repo,
      branch,
      status: "deploying",
      url: app.default_ingress,
      region,
      size,
      createdAt: new Date().toISOString(),
      lastDeployedAt: new Date().toISOString(),
    };

    res.status(201).json(deployment);
  } catch (error) {
    logger.error("Error creating deployment:", error);
    res.status(500).json({ error: "Failed to create deployment" });
  }
});

// Get deployment logs
router.get("/:id/logs", async (req, res) => {
  try {
    const { id } = req.params;

    // This would fetch logs from DigitalOcean App Platform API
    // For now, return mock logs
    const logs = [
      { timestamp: "2023-07-15T14:30:00Z", message: "Starting build process" },
      { timestamp: "2023-07-15T14:30:05Z", message: "Cloning repository" },
      { timestamp: "2023-07-15T14:30:15Z", message: "Installing dependencies" },
      { timestamp: "2023-07-15T14:31:30Z", message: "Running build script" },
      { timestamp: "2023-07-15T14:32:45Z", message: "Build completed" },
      { timestamp: "2023-07-15T14:33:00Z", message: "Deploying application" },
      { timestamp: "2023-07-15T14:33:30Z", message: "Application deployed successfully" },
    ];

    res.json(logs);
  } catch (error) {
    logger.error(`Error fetching logs for deployment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to fetch deployment logs" });
  }
});

// Restart a deployment
router.post("/:id/restart", async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Restarting deployment ${id}`);

    // Restart the app on DigitalOcean
    await appPlatform.restartApp(id);

    res.json({ message: "Deployment is restarting" });
  } catch (error) {
    logger.error(`Error restarting deployment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to restart deployment" });
  }
});

// Redeploy a deployment (pull latest code and redeploy)
router.post("/:id/redeploy", async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Redeploying deployment ${id} with latest code`);

    // Create a new deployment for the app
    const deployment = await appPlatform.createDeployment(id);

    res.json({
      message: "Deployment has started",
      status: "deploying",
      deployment
    });
  } catch (error) {
    logger.error(`Error redeploying deployment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to redeploy application" });
  }
});

// Delete a deployment
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Deleting deployment ${id}`);

    // This would delete the app on DigitalOcean
    // For now, just return success
    res.json({ message: "Deployment has been deleted" });
  } catch (error) {
    logger.error(`Error deleting deployment ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete deployment" });
  }
});

// Error handler for this router
router.use((err, req, res, next) => {
  logger.error(`GitHub deployments error: ${err.message}`, err);
  res.status(500).json({
    error: "An error occurred with GitHub deployments",
    message: err.message
  });
});

export default router;
