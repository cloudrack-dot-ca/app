import express from "express";
import { requireAuth } from "../auth";
import { logger } from "../utils/logger";

const router = express.Router();

// Require auth for these endpoints
router.use(requireAuth);

// Debug info endpoint - only accessible to admins
router.get("/", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        error: "Admin access required"
      });
    }

    // Get environment variables (sanitized)
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'Set' : 'Not Set',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'Set' : 'Not Set',
      GITHUB_REDIRECT_URI: process.env.GITHUB_REDIRECT_URI,
      DIGITAL_OCEAN_API_KEY: process.env.DIGITAL_OCEAN_API_KEY ? 'Set (first chars: ' +
        (process.env.DIGITAL_OCEAN_API_KEY.substring(0, 5) + '...)') : 'Not Set',
    };

    // System info
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime()
    };

    // Return debug info
    res.json({
      env: envVars,
      system: systemInfo,
      time: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in debug endpoint: ${(error as Error).message}`);
    res.status(500).json({
      error: "Internal server error",
      message: (error as Error).message
    });
  }
});

// Test server creation endpoint
router.post("/test-server", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({
        error: "Admin access required"
      });
    }

    // Log the server creation params but don't actually create anything
    const { name, region, size, application, auth } = req.body;

    logger.info(`[DEBUG] Test server creation with params: 
      name: ${name || 'Not Set'},
      region: ${region || 'Not Set'},
      size: ${size || 'Not Set'},
      application: ${application || 'Not Set'},
      auth type: ${auth?.type || 'Not Set'}
    `);

    // Return success with parameters received
    res.json({
      success: true,
      message: "Server parameters validated",
      params: {
        name,
        region,
        size,
        application,
        authType: auth?.type
      }
    });
  } catch (error) {
    logger.error(`Error in test server creation: ${(error as Error).message}`);
    res.status(500).json({
      error: "Internal server error",
      message: (error as Error).message
    });
  }
});

export default router;
