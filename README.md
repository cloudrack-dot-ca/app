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

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/cloudrack
SESSION_SECRET=your_session_secret_here
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Use 'live' for production
DIGITAL_OCEAN_API_KEY=your_digital_ocean_api_key
```

### Required Secrets

1. **PayPal API Credentials**: Needed for payment processing
   - PAYPAL_CLIENT_ID
   - PAYPAL_CLIENT_SECRET
   - Set PAYPAL_MODE to 'sandbox' for testing or 'live' for production

2. **Digital Ocean API Key**: Required to create and manage VPS instances
   - DIGITAL_OCEAN_API_KEY
   - Can be obtained from the Digital Ocean developer dashboard

3. **Database Connection String**: PostgreSQL connection URL
   - DATABASE_URL

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

## Troubleshooting

- If terminal connections fail, check SSH keys and firewall rules
- Database connection issues can often be resolved by verifying DATABASE_URL
- PayPal integration requires valid API credentials
- Use the admin dashboard to monitor system-wide issues