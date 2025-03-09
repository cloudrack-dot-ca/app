#!/bin/bash
# This script will fix the dependencies and install nodemon and other required packages

# Install essential dependencies
npm install --no-save compression cors express dotenv helmet morgan cookie-parser body-parser
npm install --no-save paypal-rest-sdk
npm install --no-save tsx

# Install dev dependencies
npm install --save-dev nodemon ts-node @types/compression @types/cors @types/morgan

# Remove postinstall script temporarily to avoid errors
TEMP_FILE=$(mktemp)
jq 'del(.scripts.postinstall)' package.json > "$TEMP_FILE" && mv "$TEMP_FILE" package.json

echo "Dependencies installed, start with: npm run dev"
