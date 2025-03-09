// Development entry point for nodemon
import 'dotenv/config';

console.log("Starting development server...");
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Use ts-node/esm register for direct TypeScript loading
import { register } from 'ts-node';

// Register ts-node with proper ESM support
register({
  transpileOnly: true,
  esm: true,
  experimentalSpecifierResolution: 'node',
});

console.log("TypeScript registration complete, loading server...");

// Import the server using .js extension (ts-node will resolve to .ts files)
import('./server/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
