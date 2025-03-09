// Development entry point for nodemon
import 'dotenv/config';

console.log("Starting development server...");
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Import the ts-node register
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('ts-node').register({
  transpileOnly: true,
  esm: true
});

// Import the server
import('./server/index.ts').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
