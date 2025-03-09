import axios from 'axios';
import { Express } from 'express';
import { storage } from './storage';
import { requireAuth } from './auth';

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export class GitHubOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private debugMode: boolean = true; // Enable for more detailed logging

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID || '';
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    this.redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/auth/github/callback';

    if (!this.clientId || !this.clientSecret) {
      console.error('❌ [GitHub] GitHub OAuth credentials not configured properly.');
    } else {
      console.log('ℹ️ 🐙 [GitHub] GitHub OAuth Configuration:');
      console.log(`ℹ️ 🐙 [GitHub] - Client ID: ${this.clientId.substring(0, 5)}...`);
      console.log(`ℹ️ 🐙 [GitHub] - Client Secret: ${this.clientSecret ? 'Set' : 'Not Set'}`);
      console.log(`ℹ️ 🐙 [GitHub] - Redirect URI: ${this.redirectUri}`);

      if (this.debugMode) {
        // Show full redirect URI in debug mode
        console.log(`ℹ️ 🐙 [GitHub] DEBUG - Full Redirect URI: ${this.redirectUri}`);
      }

      console.log('✅ GitHub OAuth credentials successfully loaded. GitHub integration is available.');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'repo,user:email'
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    if (this.debugMode) {
      console.log(`ℹ️ 🐙 [GitHub] DEBUG - Generated Auth URL: ${authUrl}`);
    }

    return authUrl;
  }

  async getAccessToken(code: string): Promise<string> {
    try {
      console.log(`ℹ️ 🐙 [GitHub] Exchanging code for access token...`);

      // Debug info
      if (this.debugMode) {
        console.log(`ℹ️ 🐙 [GitHub] DEBUG - Exchange parameters:`);
        console.log(`  - Client ID: ${this.clientId}`);
        console.log(`  - Redirect URI: ${this.redirectUri}`);
        console.log(`  - Code: ${code.substring(0, 6)}...`);
      }

      const params = {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri
      };

      if (this.debugMode) {
        console.log(`ℹ️ 🐙 [GitHub] DEBUG - Making POST request to https://github.com/login/oauth/access_token`);
        console.log(`ℹ️ 🐙 [GitHub] DEBUG - Params: ${JSON.stringify({
          ...params,
          client_secret: '***MASKED***'
        })}`);
      }

      const tokenResponse = await axios.post<GitHubTokenResponse>(
        'https://github.com/login/oauth/access_token',
        params,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (this.debugMode) {
        console.log(`ℹ️ 🐙 [GitHub] DEBUG - Response status: ${tokenResponse.status}`);
        console.log(`ℹ️ 🐙 [GitHub] DEBUG - Response headers: ${JSON.stringify(tokenResponse.headers)}`);
        console.log(`ℹ️ 🐙 [GitHub] DEBUG - Response data: ${JSON.stringify({
          ...tokenResponse.data,
          access_token: tokenResponse.data.access_token ? '***MASKED***' : undefined
        })}`);
      }

      if (!tokenResponse.data.access_token) {
        console.error('❌ [GitHub] No access token in response:', tokenResponse.data);
        throw new Error('GitHub did not provide an access token');
      }

      console.log('✅ [GitHub] Successfully obtained access token');
      return tokenResponse.data.access_token;
    } catch (error) {
      console.error('❌ [GitHub] Failed to exchange code for token:', error.message);

      if (error.response) {
        console.error(`❌ [GitHub] Response status: ${error.response.status}`);
        console.error(`❌ [GitHub] Response headers: ${JSON.stringify(error.response.headers)}`);
        console.error(`❌ [GitHub] Response data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error(`❌ [GitHub] No response received. Request: ${JSON.stringify(error.request)}`);
      }

      throw new Error('Failed to obtain access token');
    }
  }

  setupRoutes(app: Express): void {
    if (!this.isConfigured()) {
      console.warn('⚠️ [GitHub] OAuth routes not set up due to missing configuration');
      return;
    }

    // Route to redirect to GitHub OAuth
    app.get('/api/github/authorize', requireAuth, (req, res) => {
      const authUrl = this.getAuthUrl();
      console.log(`ℹ️ 🐙 [GitHub] Redirecting to GitHub OAuth URL: ${authUrl}`);
      res.redirect(authUrl);
    });

    // Direct link route that returns the auth URL instead of redirecting
    app.get('/api/github/auth-url', requireAuth, (req, res) => {
      const authUrl = this.getAuthUrl();
      console.log(`ℹ️ 🐙 [GitHub] Returning GitHub OAuth URL: ${authUrl}`);
      res.json({ url: authUrl });
    });

    // GitHub OAuth callback - setup both endpoints for compatibility
    const callbackHandler = async (req, res) => {
      const { code, error } = req.query as { code?: string, error?: string };

      console.log(`ℹ️ 🐙 [GitHub] Received callback: ${req.url}`);
      console.log(`ℹ️ 🐙 [GitHub] Code present: ${Boolean(code)}, Error present: ${Boolean(error)}`);

      if (error) {
        console.error(`❌ [GitHub] OAuth error: ${error}`);
        return res.redirect('/dashboard?error=github-oauth-rejected');
      }

      if (!code) {
        console.error('❌ [GitHub] No code provided in callback');
        return res.redirect('/dashboard?error=github-no-code');
      }

      try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
          console.log('❌ [GitHub] User not authenticated during callback');

          if (this.debugMode) {
            console.log('ℹ️ 🐙 [GitHub] DEBUG - User object:', req.user);
            console.log('ℹ️ 🐙 [GitHub] DEBUG - Session:', req.session);
          }

          // In this case, we'll show instructions to log in first
          return res.send(`
            <html>
              <head>
                <title>GitHub Authentication</title>
                <style>
                  body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; }
                  .card { border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                  .button { background: #0366d6; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 1rem; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h2>Almost there!</h2>
                  <p>Your GitHub authorization was successful, but you need to be logged in to complete the connection.</p>
                  <p>Please log in to your account first, then try connecting GitHub again.</p>
                  <a class="button" href="/login">Go to Login</a>
                </div>
              </body>
            </html>
          `);
        }

        const accessToken = await this.getAccessToken(code);

        // Store the token in the database
        await storage.updateUser(req.user.id, { github_token: accessToken });

        console.log(`✅ [GitHub] Successfully linked GitHub account for user ${req.user.id}`);
        res.redirect('/dashboard?github=connected');
      } catch (error) {
        console.error('❌ [GitHub] Error during token exchange:', error);

        // Return detailed error page in debug mode
        if (this.debugMode) {
          return res.send(`
            <html>
              <head>
                <title>GitHub Authentication Error</title>
                <style>
                  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
                  .error-card { border: 1px solid #f44336; border-radius: 8px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                  .error-title { color: #f44336; }
                  pre { background: #f1f1f1; padding: 1rem; border-radius: 4px; overflow: auto; }
                  .button { background: #0366d6; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; display: inline-block; margin-top: 1rem; }
                </style>
              </head>
              <body>
                <div class="error-card">
                  <h2 class="error-title">GitHub Authentication Error</h2>
                  <p>There was an error exchanging the code for an access token:</p>
                  <pre>${error.message || 'Unknown error'}</pre>

                  <h3>Debug Information:</h3>
                  <ul>
                    <li>Client ID: ${this.clientId.substring(0, 5)}...</li>
                    <li>Redirect URI: ${this.redirectUri}</li>
                    <li>Code length: ${code.length}</li>
                  </ul>

                  <a class="button" href="/dashboard">Return to Dashboard</a>
                </div>
              </body>
            </html>
          `);
        }

        res.redirect('/dashboard?error=github-token-exchange');
      }
    };

    // Register callback handlers for both paths
    app.get('/auth/github/callback', callbackHandler);
    app.get('/api/github/callback', callbackHandler); // Add this route as a fallback

    // API route to check GitHub connection status
    app.get('/api/github/status', requireAuth, async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await storage.getUser(req.user.id);
      const isConnected = Boolean(user?.github_token);

      res.json({
        connected: isConnected
      });
    });

    // API route to disconnect GitHub
    app.post('/api/github/disconnect', requireAuth, async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      try {
        await storage.updateUser(req.user.id, { github_token: null });
        res.json({ success: true, message: 'GitHub account disconnected' });
      } catch (error) {
        console.error('❌ [GitHub] Error disconnecting account:', error);
        res.status(500).json({ error: 'Failed to disconnect GitHub account' });
      }
    });

    // API route to get GitHub repositories
    app.get('/api/github/repos', requireAuth, async (req, res) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await storage.getUser(req.user.id);
      if (!user?.github_token) {
        return res.status(401).json({ error: 'GitHub account not connected' });
      }

      try {
        const response = await axios.get('https://api.github.com/user/repos', {
          headers: {
            Authorization: `token ${user.github_token}`,
            Accept: 'application/vnd.github.v3+json'
          },
          params: {
            sort: 'updated',
            per_page: 100
          }
        });

        res.json(response.data);
      } catch (error) {
        console.error('❌ [GitHub] Error fetching repositories:', error.response?.data || error.message);

        // Check if token is invalid
        if (error.response?.status === 401) {
          await storage.updateUser(req.user.id, { github_token: null });
          return res.status(401).json({ error: 'GitHub token is invalid. Please reconnect your account.' });
        }

        res.status(500).json({ error: 'Failed to fetch GitHub repositories' });
      }
    });
  }
}

export const githubOAuth = new GitHubOAuth();
