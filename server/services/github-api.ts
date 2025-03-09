import fetch from "node-fetch";
import { logger } from "../utils/logger";

const GITHUB_API_URL = "https://api.github.com";

/**
 * Make a request to the GitHub API with proper authorization
 */
export async function githubApiRequest(
  path: string,
  token: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) {
  try {
    const url = path.startsWith("http") ? path : `${GITHUB_API_URL}${path}`;
    const method = options.method || "GET";

    const headers = {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "SkyVPS360-Platform",
      ...options.headers
    };

    // Add Content-Type if body is present
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const requestOptions: any = {
      method,
      headers
    };

    // Add body if present
    if (options.body) {
      requestOptions.body = typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
    }

    const response = await fetch(url, requestOptions);

    // If response is not ok, throw error
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`GitHub API error: ${response.status} ${errorText}`);
      throw new Error(`GitHub API returned status ${response.status}: ${errorText}`);
    }

    // If response is 204 No Content, return empty object
    if (response.status === 204) {
      return {};
    }

    return await response.json();
  } catch (error) {
    logger.error(`Error in githubApiRequest to ${path}:`, error);
    throw error;
  }
}

/**
 * Get user information from GitHub
 */
export async function getGitHubUser(token: string) {
  return await githubApiRequest("/user", token);
}

/**
 * Get user repositories from GitHub
 */
export async function getGitHubRepos(token: string) {
  return await githubApiRequest("/user/repos?sort=updated&per_page=100", token);
}

/**
 * Get branches for a repository
 */
export async function getGitHubBranches(token: string, owner: string, repo: string) {
  return await githubApiRequest(`/repos/${owner}/${repo}/branches`, token);
}

/**
 * Create a repository webhook
 */
export async function createGitHubWebhook(token: string, owner: string, repo: string, webhookUrl: string, secret: string) {
  return await githubApiRequest(`/repos/${owner}/${repo}/hooks`, token, {
    method: "POST",
    body: {
      name: "web",
      active: true,
      events: ["push", "pull_request"],
      config: {
        url: webhookUrl,
        content_type: "json",
        insecure_ssl: "0",
        secret
      }
    }
  });
}

/**
 * Check if a repository webhook exists
 */
export async function getGitHubWebhooks(token: string, owner: string, repo: string) {
  return await githubApiRequest(`/repos/${owner}/${repo}/hooks`, token);
}
