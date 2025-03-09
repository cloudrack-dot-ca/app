import { Express } from 'express';
import dotenv from 'dotenv';

export function setupDebugRoutes(app: Express) {
  // Only enable in development
  if (process.env.NODE_ENV === 'production') return;

  // Route to check environment variables (don't expose in production!)
  app.get('/debug/env', (req, res) => {
    // Sensitive info check
    if (!req.query.secret || req.query.secret !== 'debug-mode') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Add ?secret=debug-mode to view environment variables'
      });
    }

    // Show relevant env vars with some masking for security
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ?
        `${process.env.GITHUB_CLIENT_ID.substring(0, 5)}...` : 'not set',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ?
        'set (length: ' + process.env.GITHUB_CLIENT_SECRET.length + ')' : 'not set',
      GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL,
      DATABASE_URL: process.env.DATABASE_URL ?
        `...${process.env.DATABASE_URL.split('@')[1] || 'masked'}` : 'not set',
      PORT: process.env.PORT || '5000 (default)',
    };

    res.json({
      env: envVars,
      dotenvLoaded: typeof process.env.GITHUB_CLIENT_ID === 'string',
      nodeVersion: process.version,
    });
  });

  // Test GitHub OAuth URL generation
  app.get('/debug/github-url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_CALLBACK_URL;

    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID not set' });
    }

    if (!redirectUri) {
      return res.status(500).json({ error: 'GITHUB_CALLBACK_URL not set' });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo,user:email'
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    res.json({
      authUrl,
      redirectUri,
      clientIdPrefix: clientId.substring(0, 5) + '...'
    });
  });
}
