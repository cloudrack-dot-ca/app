# CloudRack VPS Hosting Platform

CloudRack is a comprehensive VPS hosting reseller platform with advanced SSH terminal connection management and intelligent authentication workflows.

## Features

- React.js frontend with dynamic server management interface
- Enhanced SSH terminal connection handler with customizable display options
- Multiple font size options (8px, 10px, 11px, 14px default)
- Advanced authentication method detection and fallback mechanisms
- Intelligent firewall management with configurable polling
- Support for multiple authentication methods (password, SSH key)
- Detailed logging and status reporting for connection attempts
- Integrated admin dashboard with billing and server statistics

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Digital Ocean API key (for production use)

### Environment Variables and Secrets

The application uses both environment variables and Replit Secrets for configuration.

#### Replit Secrets (Recommended for sensitive data)

Add the following as Replit Secrets for secure storage:

```
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Use 'live' for production
DIGITAL_OCEAN_API_KEY=your_digital_ocean_api_key
DATABASE_URL=postgresql://username:password@localhost:5432/cloudrack
SESSION_SECRET=your_session_secret_here
FORCE_MOCK_FIREWALLS=true  # Optional: Set to 'true' to use mock firewalls
```

#### Environment Variables (Alternative)

You can also use a `.env` file in the root directory for development, but secrets are preferred for production:

```
DATABASE_URL=postgresql://username:password@localhost:5432/cloudrack
SESSION_SECRET=your_session_secret_here
```

### Required Configuration

1. **PayPal API Credentials**: Needed for payment processing
   - PAYPAL_CLIENT_ID
   - PAYPAL_CLIENT_SECRET
   - Set PAYPAL_MODE to 'sandbox' for testing or 'live' for production

2. **Digital Ocean API Key**: Required to create and manage VPS instances
   - DIGITAL_OCEAN_API_KEY
   - Can be obtained from the Digital Ocean developer dashboard

3. **Database Connection String**: PostgreSQL connection URL
   - DATABASE_URL

4. **Firewall Configuration**:
   - FORCE_MOCK_FIREWALLS: When set to 'true', the system will use mock firewalls instead of creating real Digital Ocean firewalls
   - This is useful for development environments or when testing firewall UI without making actual API calls

### Installation Steps

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up the database:
   ```
   npm run db:push
   ```
4. Start the application:
   ```
   npm run dev
   ```

## Architecture Overview

### Frontend (React + TypeScript)
- Built with React and TypeScript
- Uses wouter for routing
- TanStack Query for data fetching
- Shadcn/UI for component library
- TailwindCSS for styling

### Backend (Node.js + Express)
- Express.js server
- Drizzle ORM for database interactions
- Passport.js for authentication
- Socket.IO for real-time terminal connections

### Database (PostgreSQL)
- Stores user accounts, servers, transactions, and system data
- Managed through Drizzle ORM

## User Roles

1. **Regular Users**
   - Can create and manage their own VPS servers
   - Access SSH terminals for their servers
   - Manage billing and payments
   - Submit support tickets

2. **Administrators**
   - All regular user capabilities
   - Access to admin dashboard
   - Can view and manage all users, servers, and transactions
   - Ability to respond to support tickets
   - IP ban management for security

## Usage Guide

### Server Management
1. Users can create servers with different configurations (RAM, CPU, region)
2. Each server has a built-in SSH terminal for direct access
3. Firewall rules can be configured for each server
4. Server metrics are displayed in real-time charts

### Billing System
1. Users can add funds to their account via PayPal
2. Servers and volumes are charged hourly based on resources
3. Transaction history is available for tracking spending
4. Invoices can be downloaded as needed

### Support System
1. Users can create support tickets for technical assistance
2. Tickets can be categorized by priority and status
3. Messaging system allows for ongoing communication
4. Administrators can respond and update ticket status

## Development Notes

- The server uses mock Digital Ocean API responses when the API key is not available
- SSH terminal connections are handled through a secure WebSocket bridge
- Cloud firewall rules are synchronized with Digital Ocean's firewall service
- The billing system automatically calculates and deducts costs every hour

### Mock Mode Configuration

The application supports a mock mode for development and testing without needing to make actual API calls to Digital Ocean.

#### Mock Firewalls

By setting `FORCE_MOCK_FIREWALLS=true` in your Replit Secrets:

- All firewall operations will use in-memory mock data instead of making API calls
- The UI will function normally, but no actual firewalls will be created/modified at Digital Ocean
- This is useful for UI development or demo instances

#### Mock Digital Ocean API

If no `DIGITAL_OCEAN_API_KEY` is provided:

- The application automatically switches to mock mode for all Digital Ocean operations
- Predefined mock data for regions, sizes, and applications will be used
- Server creation will still work but will use simulated data

#### Pricing Markup Configuration

By default, the system applies a 0.5% markup over Digital Ocean's base pricing. Administrators can adjust this markup percentage in the Admin Panel under the "Settings" tab.

#### Development vs. Production Mode

It's important to use the correct mode based on your needs:
- For development: Use mock mode with `FORCE_MOCK_FIREWALLS=true`
- For production: Provide valid API keys and disable mock modes

## Troubleshooting

- If terminal connections fail, check SSH keys and firewall rules
- Database connection issues can often be resolved by verifying DATABASE_URL
- PayPal integration requires valid API credentials
- Use the admin dashboard to monitor system-wide issues