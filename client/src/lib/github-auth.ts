import { apiRequest } from "./queryClient";

/**
 * Initiates the GitHub OAuth flow by requesting the auth URL and redirecting the user
 * @returns Promise resolving to true if redirect successful
 */
export async function initiateGitHubOAuth(): Promise<boolean> {
  try {
    // Get the GitHub OAuth authorization URL
    const response = await apiRequest("GET", "/api/github/auth-url");

    if (!response?.url) {
      throw new Error("Failed to get GitHub authorization URL");
    }

    // Log the URL for debugging
    console.log("Redirecting to GitHub OAuth:", response.url);

    // Perform the redirect
    window.location.href = response.url;
    return true;
  } catch (error) {
    console.error("GitHub OAuth initialization failed:", error);
    throw error;
  }
}

/**
 * Creates a direct GitHub OAuth URL without going through the backend
 * This is useful as a fallback if the backend route has issues
 */
export function createDirectGitHubOAuthUrl(): string {
  // These values should match what's in your .env file
  const clientId = "Ov23lis2zEGGv7CCm9SG";
  const redirectUri = "http://localhost:5000/api/github/callback";
  const scope = "repo,user:email";
  const state = Math.random().toString(36).substring(7); // Random state for CSRF protection

  return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
}
