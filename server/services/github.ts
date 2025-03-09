import fetch from "node-fetch";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

// Try to load GitHub credentials from .env.local first, then fall back to .env
function loadEnvCredentials() {
  try {
    const localEnvPath = path.resolve(process.cwd(), '.env.local');
    const envPath = path.resolve(process.cwd(), '.env');

    let credentials = {};

    // Try .env.local first
    if (fs.existsSync(localEnvPath)) {
      logger.info("Loading GitHub credentials from .env.local");
      const localEnvFile = fs.readFileSync(localEnvPath, 'utf8');
      localEnvFile.split('\n').forEach(line => {
        const match = line.match(/^GITHUB_([A-Z_]+)=(.*)$/);
        if (match) {
          credentials[match[1]] = match[2].replace(/^["']|["']$/g, ''); // Remove quotes if present
        }
      });
    }

    // If not found in .env.local, try .env
    if (Object.keys(credentials).length === 0 && fs.existsSync(envPath)) {
      logger.info("Loading GitHub credentials from .env");
      const envFile = fs.readFileSync(envPath, 'utf8');
      envFile.split('\n').forEach(line => {
        const match = line.match(/^GITHUB_([A-Z_]+)=(.*)$/);
        if (match) {
          credentials[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
      });
    }

    return credentials;
  } catch (error) {
    logger.error("Error loading env credentials:", error);
    return {};
  }
}

// Load credentials from env files directly
const envCredentials = loadEnvCredentials();

// Fix GitHub OAuth configuration - explicitly remove any "+" character in addition to trimming
const GITHUB_CLIENT_ID = (process.env.GITHUB_CLIENT_ID || envCredentials.CLIENT_ID || "")
  .trim()
  .replace(/^\+/, ""); // Remove leading + character if present

const GITHUB_CLIENT_SECRET = (process.env.GITHUB_CLIENT_SECRET || envCredentials.CLIENT_SECRET || "").trim();
const GITHUB_REDIRECT_URI = (process.env.GITHUB_REDIRECT_URI || envCredentials.REDIRECT_URI || "http://localhost:5000/api/github/callback").trim();

logger.github("GitHub OAuth Configuration:");
logger.github(`- Client ID: ${GITHUB_CLIENT_ID ? "Set" : "Not set"} (${GITHUB_CLIENT_ID.substring(0, 4)}...)`);
logger.github(`- Client Secret: ${GITHUB_CLIENT_SECRET ? "Set" : "Not set"}`);
logger.github(`- Redirect URI: ${GITHUB_REDIRECT_URI}`);

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  logger.warning("GitHub OAuth credentials not set. GitHub integration will not work.");
} else {
  logger.success("GitHub OAuth credentials successfully loaded. GitHub integration is available.");
}

export async function getGitHubOAuthURL() {
  const state = Math.random().toString(36).substring(7);

  // Store state in server session for security (prevents CSRF attacks)
  // This is optional but recommended

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: "repo", // Only request repo access
    state
  });

  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  logger.github(`Generated OAuth URL: ${url}`);
  return url;
}

export async function exchangeCodeForToken(code: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_REDIRECT_URI,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

export async function saveGitHubToken(userId: number, token: string) {
  await db.update(users)
    .set({ githubToken: token })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function getUserRepositories(token: string) {
  const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${await response.text()}`);
  }

  return await response.json();
}

export async function createGitHubDeployment(token: string, repo: string, values: any) {
  // This would integrate with GitHub Actions or Deployments
  // For now, we'll just return a success message
  return { success: true, message: "Deployment initialized" };
}
