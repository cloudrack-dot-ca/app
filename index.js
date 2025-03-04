
import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('ts-node').register({
  transpileOnly: true,
  esm: true
});

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

console.log("Starting application with database:", process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown');
import('./server/index.ts');
