import fetch from 'node-fetch';
import { logger } from '../utils/logger';

// Base GitHub API URL
const GITHUB_API_BASE = 'https://api.github.com';

// Helper function to make authenticated GitHub API requests
async function githubRequest(endpoint: string, token: string, options = {}) {
  try {
    const url = `${GITHUB_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`GitHub API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error(`Error making GitHub request to ${endpoint}:`, error);
    throw error;
  }
}

// Get GitHub user information
export async function getGitHubUser(token: string) {
  return await githubRequest('/user', token);
}

// Get user's repositories
export async function getUserRepositories(token: string) {
  return await githubRequest('/user/repos?sort=updated&per_page=100', token);
}

// Get repository branches
export async function getRepositoryBranches(token: string, owner: string, repo: string) {
  return await githubRequest(`/repos/${owner}/${repo}/branches`, token);
}

// Create a deployment
export async function createDeployment(token: string, owner: string, repo: string, ref: string, environment = 'production') {
  return await githubRequest(`/repos/${owner}/${repo}/deployments`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref,
      environment,
      auto_merge: false,
      required_contexts: []
    })
  });
}

// Get deployment status
export async function getDeploymentStatus(token: string, owner: string, repo: string, deploymentId: number) {
  return await githubRequest(`/repos/${owner}/${repo}/deployments/${deploymentId}/statuses`, token);
}

// Get repository content
export async function getRepositoryContent(token: string, owner: string, repo: string, path: string) {
  return await githubRequest(`/repos/${owner}/${repo}/contents/${path}`, token);
}

// Create or update a file in the repository
export async function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
) {
  const endpoint = `/repos/${owner}/${repo}/contents/${path}`;
  const body: any = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch
  };

  if (sha) {
    body.sha = sha;
  }

  return await githubRequest(endpoint, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

// Create a repository webhook
export async function createWebhook(token: string, owner: string, repo: string, webhookUrl: string, secret: string) {
  return await githubRequest(`/repos/${owner}/${repo}/hooks`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'web',
      active: true,
      events: ['push', 'pull_request'],
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret
      }
    })
  });
}
