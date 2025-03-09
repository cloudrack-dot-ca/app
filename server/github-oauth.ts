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

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<string> {
    try {
      console.log(`ℹ️ 🐙 [GitHub] Exchanging code for access token...`);
      const tokenResponse = await axios.post<GitHubTokenResponse>(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          redirect_uri: this.redirectUri
        },
        {
          headers: {
            Accept: 'application/json'
          }
        }
      );

      if (!tokenResponse.data.access_token) {
        console.error('❌ [GitHub] No access token in response:', tokenResponse.data);
        throw new Error('GitHub did not provide an access token');
      }

      console.log('✅ [GitHub] Successfully obtained access token');
      return tokenResponse.data.access_token;
    } catch (error) {
      console.error('❌ [GitHub] Failed to exchange code for token:', error.response?.data || error.message);
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

    // GitHub OAuth callback
    app.get('/auth/github/callback', async (req, res) => {
      const { code, error } = req.query as { code?: string, error?: string };

      if (error) {
        console.error(`❌ [GitHub] OAuth error: ${error}`);
        return res.redirect('/dashboard?error=github-oauth-rejected');
      }

      if (!code) {
        console.error('❌ [GitHub] No code provided in callback');
        return res.redirect('/dashboard?error=github-no-code');
      }

      if (!req.user || !req.user.id) {
        console.error('❌ [GitHub] User not authenticated during callback');
        return res.redirect('/login?error=auth-required');
      }

      try {
        const accessToken = await this.getAccessToken(code);

        // Store the token in the database
        await storage.updateUser(req.user.id, { github_token: accessToken });

        console.log(`✅ [GitHub] Successfully linked GitHub account for user ${req.user.id}`);
        res.redirect('/dashboard?github=connected');
      } catch (error) {
        console.error('❌ [GitHub] Error during token exchange:', error);
        res.redirect('/dashboard?error=github-token-exchange');
      }
    });

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
  }
}

export const githubOAuth = new GitHubOAuth();
