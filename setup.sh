#!/bin/bash

echo "========== Setting up SkyVPS360 =========="

# Remove package-lock.json and node_modules to start fresh
echo "Cleaning up existing installation..."
rm -rf node_modules package-lock.json dist

# Install dependencies
echo "Installing dependencies..."
npm install compression cors helmet morgan express dotenv --no-save
npm install nodemon ts-node --save-dev

# Fix for PayPal SDK issues
echo "Installing PayPal REST SDK..."
npm install paypal-rest-sdk --save

# Build the application
echo "Building the application..."
npm run build

echo "========== Setup complete! =========="
echo "You can now run:"
echo "npm run dev   # For development"
echo "npm run start # To run the built application"
