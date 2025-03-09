#!/usr/bin/env node

// This is a simple script to start the server directly with ts-node/esm
// It avoids the common ESM + TypeScript issues

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Run the server with ts-node/esm
console.log('Starting server with ts-node/esm...');

// Use NODE_OPTIONS to include experimental features
process.env.NODE_OPTIONS = '--experimental-specifier-resolution=node';

// Run tsx (a simplified ts-node wrapper) directly
const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
  },
  shell: true,
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(code || 1);
  }
});
