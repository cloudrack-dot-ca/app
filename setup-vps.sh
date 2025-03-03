#!/bin/bash

# Exit on any error
set -e

echo "Setting up CloudRack on VPS..."

# Install system dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl postgresql postgresql-contrib

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install global dependencies
npm install -g ts-node typescript pm2 dotenv

# Configure PostgreSQL
sudo -u postgres psql << EOF
CREATE USER cloudrack WITH PASSWORD 'your_secure_password';
CREATE DATABASE cloudrack OWNER cloudrack;
GRANT ALL PRIVILEGES ON DATABASE cloudrack TO cloudrack;
EOF

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://cloudrack:your_secure_password@localhost:5432/cloudrack
SESSION_SECRET=your_session_secret_here
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox
DIGITAL_OCEAN_API_KEY=your_digital_ocean_api_key
EOF

# Load environment variables
set -a
source .env
set +a

# Install project dependencies
npm install

# Initialize database (temporarily disable SSL verification)
export NODE_ENV=development
export NODE_TLS_REJECT_UNAUTHORIZED=0
npm run db:push

# Reset environment to production
unset NODE_TLS_REJECT_UNAUTHORIZED
export NODE_ENV=production

echo "Setup complete! You can now start the application with:"
echo "node index.js"
echo "or for production:"
echo "pm2 start index.js --name \"cloudrack\""
