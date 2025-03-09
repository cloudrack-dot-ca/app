import fetch from "node-fetch";
import { logger } from "../utils/logger";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Load DigitalOcean token from environment variable
const DO_TOKEN = process.env.DIGITAL_OCEAN_API_KEY || "";
const BASE_URL = "https://api.digitalocean.com/v2";

/**
 * Creates a new app on DigitalOcean App Platform from a GitHub repository
 */
export async function createAppFromGitHub(userId: number, options: {
  name: string;
  repository: string;
  branch: string;
  region: string;
  size: string;
  environmentVariables?: Record<string, string>;
}) {
  // Get the user to retrieve GitHub token
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user?.githubToken) {
    throw new Error("User is not connected to GitHub");
  }

  // Format the repository to match DO's expectations
  const [owner, repo] = options.repository.split('/');

  // Build the App Platform spec
  const appSpec = {
    name: options.name,
    region: options.region,
    services: [
      {
        name: options.name,
        github: {
          repo: options.repository,
          branch: options.branch,
          deploy_on_push: true
        },
        source_dir: "/",
        instance_size_slug: options.size,
        instance_count: 1,
        http_port: 8080,
        run_command: "start",
        envs: Object.entries(options.environmentVariables || {}).map(([key, value]) => ({
          key,
          value,
          scope: "RUN_AND_BUILD_TIME"
        }))
      }
    ]
  };

  try {
    logger.info(`Creating new App Platform app: ${options.name} from ${options.repository}:${options.branch}`);

    const response = await fetch(`${BASE_URL}/apps`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DO_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        spec: appSpec
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`Error creating app: ${response.status} ${errorData}`);
      throw new Error(`Failed to create app: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    logger.success(`Successfully created app: ${data.app.id}`);
    return data.app;
  } catch (error) {
    logger.error(`Error in createAppFromGitHub: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get all apps for a user
 */
export async function getApps() {
  try {
    const response = await fetch(`${BASE_URL}/apps`, {
      headers: {
        "Authorization": `Bearer ${DO_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get apps: ${response.status}`);
    }

    const data = await response.json();
    return data.apps;
  } catch (error) {
    logger.error(`Error in getApps: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get app details
 */
export async function getApp(appId: string) {
  try {
    const response = await fetch(`${BASE_URL}/apps/${appId}`, {
      headers: {
        "Authorization": `Bearer ${DO_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get app: ${response.status}`);
    }

    const data = await response.json();
    return data.app;
  } catch (error) {
    logger.error(`Error in getApp: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get app deployments
 */
export async function getAppDeployments(appId: string) {
  try {
    const response = await fetch(`${BASE_URL}/apps/${appId}/deployments`, {
      headers: {
        "Authorization": `Bearer ${DO_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get app deployments: ${response.status}`);
    }

    const data = await response.json();
    return data.deployments;
  } catch (error) {
    logger.error(`Error in getAppDeployments: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Create a new deployment
 */
export async function createDeployment(appId: string) {
  try {
    const response = await fetch(`${BASE_URL}/apps/${appId}/deployments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DO_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        force_build: true
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create deployment: ${response.status}`);
    }

    const data = await response.json();
    return data.deployment;
  } catch (error) {
    logger.error(`Error in createDeployment: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get app instance sizes
 */
export async function getInstanceSizes() {
  try {
    const response = await fetch(`${BASE_URL}/apps/tiers/instance_sizes`, {
      headers: {
        "Authorization": `Bearer ${DO_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get instance sizes: ${response.status}`);
    }

    const data = await response.json();
    return data.instance_sizes;
  } catch (error) {
    logger.error(`Error in getInstanceSizes: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get app regions
 */
export async function getRegions() {
  try {
    const response = await fetch(`${BASE_URL}/apps/regions`, {
      headers: {
        "Authorization": `Bearer ${DO_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get regions: ${response.status}`);
    }

    const data = await response.json();
    return data.regions;
  } catch (error) {
    logger.error(`Error in getRegions: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Restart an app
 */
export async function restartApp(appId: string, components?: string[]) {
  try {
    const response = await fetch(`${BASE_URL}/apps/${appId}/restart`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DO_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(components ? { components } : {})
    });

    if (!response.ok) {
      throw new Error(`Failed to restart app: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(`Error in restartApp: ${(error as Error).message}`);
    throw error;
  }
}
