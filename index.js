#!/usr/bin/env node
require('dotenv').config();
require('ts-node').register();

// Add environment validation
const requiredEnvVars = [
  'DATABASE_URL',
  'NODE_ENV'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingEnvVars.forEach(envVar => {
    console.error(`- ${envVar}`);
  });
  console.error('\nPlease set these variables in your .env file or environment');
  process.exit(1);
}

require('./server/index.ts');