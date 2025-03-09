#!/usr/bin/env node

// Simple script to check if drizzle-kit is available and log if not
import { execSync } from 'child_process';
import fs from 'fs';

try {
  console.log('Checking for drizzle-kit...');

  try {
    // Try to execute drizzle-kit version to see if it's available
    execSync('npx drizzle-kit --version', { stdio: 'ignore' });
    console.log('✅ drizzle-kit is available');
  } catch (error) {
    console.warn('⚠️ drizzle-kit is not available in the current environment');
    console.warn('Database migrations via drizzle-kit will not work');

    // Create a flag file to indicate drizzle is not available
    fs.writeFileSync('.drizzle-unavailable', 'true');
  }
} catch (error) {
  console.error('Error checking drizzle-kit:', error);
}
