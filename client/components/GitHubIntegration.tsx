import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Alert, Box, Typography, CircularProgress, Card, CardContent } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';

export function GitHubIntegration() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    checkGitHubStatus();
  }, []);

  const checkGitHubStatus = async () => {
    try {
      const response = await axios.get('/api/github/status');
      setStatus(response.data.connected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error checking GitHub status:', error);
      setStatus('error');
      setErrorMessage('Failed to check GitHub connection status');
    }
  };

  const disconnectGitHub = async () => {
    try {
      setStatus('loading');
      await axios.post('/api/github/disconnect');
      setStatus('disconnected');
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      setStatus('error');
      setErrorMessage('Failed to disconnect GitHub account');
    }
  };

  const connectGitHub = async () => {
    window.location.href = '/api/github/authorize';
  };

  const getDirectAuthUrl = async () => {
    try {
      const response = await axios.get('/api/github/auth-url');
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      } else {
        setErrorMessage('No authentication URL returned');
      }
    } catch (error) {
      console.error('Error getting GitHub auth URL:', error);
      setErrorMessage('Failed to get GitHub authentication URL');
    }
  };

  if (status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={24} />
        <Typography ml={1}>Checking GitHub connection...</Typography>
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <GitHubIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          GitHub Integration
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        {status === 'connected' ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Your GitHub account is successfully connected
            </Alert>
            <Button
              variant="outlined"
              color="secondary"
              onClick={disconnectGitHub}
              startIcon={<LinkOffIcon />}
            >
              Disconnect GitHub Account
            </Button>
          </>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Connect your GitHub account to deploy your projects directly from your repositories
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={connectGitHub}
                startIcon={<LinkIcon />}
              >
                Connect GitHub Account
              </Button>

              <Button
                variant="outlined"
                onClick={getDirectAuthUrl}
                startIcon={<GitHubIcon />}
              >
                Open Auth in New Tab
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
