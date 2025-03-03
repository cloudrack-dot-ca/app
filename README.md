# CloudRack VPS Hosting Platform

CloudRack is a comprehensive cloud VPS hosting provider platform with advanced server management, SSH terminal access, and intelligent billing systems. This platform allows users to quickly deploy virtual servers across multiple global regions with various configurations to suit different workloads and budgets.

## 🚀 Core Features

### Server Management
- **Instant Provisioning**: Deploy servers in seconds with pre-configured applications or clean OS distributions
- **Global Regions**: Choose from multiple datacenter locations worldwide
- **Multiple Server Plans**: Options ranging from 1GB RAM starter servers to 16GB high-performance instances
- **Custom Firewall Rules**: Configure inbound and outbound traffic rules with an intuitive interface
- **Block Storage Volumes**: Add expandable SSD storage volumes that can be attached/detached from servers


### Terminal & Access Management
- **Integrated SSH Terminal**: Direct server access through web-based terminal
- **Multiple Authentication Methods**: Support for password and SSH key authentication
- **SSH Key Management**: Create, store and manage SSH keys for secure access
- **Terminal Customization**: Adjustable font sizes and display settings

### Monitoring & Metrics
- **Real-time Server Metrics**: CPU, memory, disk, and network usage monitoring
- **Performance History**: View historical performance data with interactive charts
- **Network Usage Tracking**: Monitor bandwidth consumption with visual indicators
- **Automated Alerts**: Get notified when servers approach resource limits

### Billing & Account Management
- **Pay-as-you-Go Model**: Only pay for the resources you use
- **Hourly Billing**: Precise billing based on actual server usage
- **Transparent Pricing**: Clear breakdown of all costs
- **PayPal Integration**: Secure payment processing
- **Transaction History**: Comprehensive record of all account transactions
- **Downloadable Invoices**: Export transaction data as needed

### Network & Bandwidth
- **1TB Included Bandwidth**: Every server includes 1TB of outbound data transfer per month
- **Bandwidth Monitoring**: Track usage through an intuitive dashboard
- **Bandwidth Overage**: Automatic billing for usage beyond included limits at 0.5% of monthly server cost per GB
- **Network Traffic Visualization**: See inbound and outbound data transfer rates

### Security
- **Firewall Protection**: Custom firewall rules for each server
- **SSH Key Authentication**: Secure server access
- **IP Banning System**: Protection against abuse
- **Admin Security Tools**: Comprehensive security management for administrators

### Support System
- **Ticket Management**: Create and track support requests
- **Priority Levels**: Set urgency for faster resolution of critical issues
- **Server-Specific Support**: Attach tickets to specific servers for context
- **Message Threading**: Ongoing communication in a threaded format

## 📊 Server Plans & Pricing

### Standard VPS Plans
| Plan Name | Specs | Price (Hourly) | Price (Monthly Est.) |
|-----------|-------|----------------|---------------------|
| Starter   | 1GB RAM, 1 vCPU, 25GB SSD | $0.00704/hr | ~$5/month |
| Basic     | 2GB RAM, 1 vCPU, 50GB SSD | $0.01407/hr | ~$10/month |
| Standard  | 4GB RAM, 2 vCPU, 80GB SSD | $0.02814/hr | ~$20/month |

### High Performance VPS Plans
| Plan Name   | Specs | Price (Hourly) | Price (Monthly Est.) |
|-------------|-------|----------------|---------------------|
| Professional| 8GB RAM, 4 vCPU, 160GB SSD | $0.05632/hr | ~$40/month |
| Premium     | 16GB RAM, 8 vCPU, 320GB SSD | $0.11264/hr | ~$80/month |

### Additional Resources
- **Block Storage**: $0.000141/GB/hour (~$0.10/GB/month)
- **Bandwidth Overage**: $0.01005/GB for usage beyond the included 1TB
- **Bandwidth Billing Method**: Charged at 0.5% of monthly server cost per GB of overage

## 🛠️ Technical Architecture

### Frontend Technology Stack
- **React & TypeScript**: Modern, type-safe frontend development
- **TanStack Query**: Efficient data fetching and caching
- **Shadcn/UI & Tailwind CSS**: Beautiful, responsive design system
- **Socket.IO Client**: Real-time terminal communication
- **Recharts**: Interactive data visualization
- **React Hook Form**: Form management with validation
- **PayPal React Components**: Secure payment integration

### Backend Technology Stack
- **Node.js & Express**: Fast, scalable server architecture
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **Socket.IO**: Websocket communication for terminal access
- **SSH2**: Secure shell protocol implementation
- **Passport.js**: Authentication framework
- **PayPal SDK**: Payment processing

### Database Schema
- **Users**: Account information and authentication
- **Servers**: VPS instance configurations and status
- **Volumes**: Block storage management
- **Billing Transactions**: Payment and charge records
- **Server Metrics**: Performance and usage data
- **Support System**: Tickets and messages
- **SSH Keys**: Secure access credentials
- **Security**: IP ban system and access controls

## 💻 Administration Features

### User Management
- View and search all registered users
- Adjust user account balances
- Toggle admin privileges
- Suspend problematic accounts
- View detailed user activity

### Server Administration
- Monitor all active servers across the platform
- Track resource usage and allocation
- Identify performance issues
- Force shutdown problematic instances

### Billing Oversight
- View all financial transactions
- Track revenue and usage patterns
- Generate financial reports
- Process manual adjustments when needed

### Support System
- Respond to customer tickets
- Prioritize urgent issues
- Track resolution times
- Internal notes and status tracking

### Security Controls
- IP banning for abuse prevention
- Monitor suspicious activity
- System credentials management
- Access logs and security monitoring

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- PayPal Developer Account (for payment processing)
- DigitalOcean API Key (for production deployment)

### Environment Configuration
Required environment variables:
```
DATABASE_URL=postgresql://username:password@localhost:5432/cloudrack
SESSION_SECRET=your_session_secret_here
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Use 'live' for production
DIGITAL_OCEAN_API_KEY=your_digital_ocean_api_key
```

### Getting Started with CloudRack
1. **Register an Account**: Create a new user account on the platform
2. **Add Funds**: Use PayPal to add credits to your account balance
3. **Create a Server**: 
   - Select a region from our global availability map
   - Choose a server size that meets your needs
   - Select an operating system or application
   - Set a secure root password
   - Deploy your server with one click
4. **Manage Your Server**:
   - Connect via the integrated terminal or SSH
   - Monitor performance and resource usage
   - Configure your firewall for security
   - Add block storage volumes as needed
5. **Track Usage and Billing**:
   - Monitor bandwidth consumption
   - Review transaction history
   - Keep your account funded for uninterrupted service

### Development Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up the database:
   ```
   npm run db:push
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Access the application at http://localhost:5000

## 🚀 Detailed VPS Deployment Guide

### Running the Project in Different Environments

1. **Local Development**
   ```bash
   # Set development environment
   export NODE_ENV=development

   # Start the development server
   npm run dev
   ```

2. **Testing Database Migrations**
   ```bash
   # For first-time database setup
   export NODE_ENV=development
   export NODE_TLS_REJECT_UNAUTHORIZED=0
   npm run db:push
   ```

3. **Production Deployment**
   ```bash
   # Set production environment
   export NODE_ENV=production

   # Build and start the application
   npm run build
   pm2 start npm --name "cloudrack" -- start
   ```


### System Requirements
1. A VPS running Ubuntu 20.04 or later
2. Minimum 1GB RAM
3. 20GB SSD Storage
4. Root access to the server

### Step-by-Step Deployment Instructions

#### 1. Initial Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential git curl
```

#### 2. Install Node.js
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 9.x.x or higher
```

#### 3. Install and Configure PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER cloudrack WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE cloudrack OWNER cloudrack;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE cloudrack TO cloudrack;"
```

#### 4. Configure Environment Variables
```bash
# Create environment file
cat > ~/.env << EOL
NODE_ENV=production
DATABASE_URL=postgresql://cloudrack:your_secure_password@localhost:5432/cloudrack
SESSION_SECRET=your_session_secret_here
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Change to 'live' for production
DIGITAL_OCEAN_API_KEY=your_digital_ocean_api_key
EOL

# Load environment variables
source ~/.env
```

#### 5. Clone and Setup Application
```bash
# Clone repository
git clone <your-repo-url> cloudrack
cd cloudrack

# Install dependencies
npm install

# Build the application
npm run build

# Push database schema
NODE_ENV=development npm run db:push
```

#### 6. Running in Production
```bash
# Install PM2 process manager
sudo npm install -y pm2 -g

# Start the application
pm2 start npm --name "cloudrack" -- start

# Make PM2 start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup ubuntu -u $USER --hp /home/$USER
pm2 save
```

#### 7. Configure Nginx (Optional, for reverse proxy)
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cloudrack

# Add the following configuration:
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/cloudrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Troubleshooting Tips

1. **Database Connection Issues**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`
   - Ensure DATABASE_URL is correct in your environment

2. **Application Not Starting**
   - Check PM2 logs: `pm2 logs cloudrack`
   - Verify Node.js version: `node --version`
   - Check application logs: `pm2 log`

3. **Permission Issues**
   - Ensure proper file ownership: `sudo chown -R $USER:$USER /path/to/cloudrack`
   - Check PostgreSQL user permissions: `sudo -u postgres psql -c "\du"`

### Security Considerations

1. **Firewall Setup**
```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

2. **SSL/TLS Configuration**
```bash
# Install Certbot for HTTPS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

3. **Database Security**
- Use strong passwords
- Configure pg_hba.conf for restricted access
- Regular security updates
- Backup strategy implementation

### Maintenance

1. **Regular Updates**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm update

# Restart application
pm2 restart cloudrack
```

2. **Backup Strategy**
```bash
# Database backup
pg_dump -U cloudrack cloudrack > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf cloudrack_backup_$(date +%Y%m%d).tar.gz /path/to/cloudrack
```

## 📚 API Documentation

CloudRack provides a comprehensive API for programmatic management of all platform resources.

### Authentication
- API key-based authentication
- Endpoint: `/api/auth/token`
- Each user can generate personal API keys in account settings

### Server Management Endpoints
- GET `/api/servers` - List all servers
- POST `/api/servers` - Create a new server
- GET `/api/servers/:id` - Get server details
- DELETE `/api/servers/:id` - Delete a server
- GET `/api/servers/:id/metrics` - Get server metrics

### Billing Endpoints
- GET `/api/billing/transactions` - List billing transactions
- POST `/api/billing/deposit` - Add funds to account
- GET `/api/billing/transactions/:id/invoice` - Download invoice

### Full documentation available at `/api-docs` when in development mode

## 🔄 Bandwidth Billing System

CloudRack includes a sophisticated bandwidth tracking and billing system:

### Bandwidth Monitoring
- **Real-time Tracking**: Monitor bandwidth usage as it happens
- **Usage Bar**: Visual indicator of consumption relative to your limit
- **Warning Thresholds**: Colored indicators when approaching limits
- **Adaptive Display Units**: Values automatically display in MB, GB, or TB based on size
- **Detailed Graphs**: View daily and hourly bandwidth patterns

### Billing Logic
- **Included Bandwidth**: Every server includes 1TB (1000GB) of outbound transfer per month
- **Server-specific Billing Periods**: Bandwidth is calculated from each server's creation date
- **Prorated Limits**: Bandwidth allocations are prorated for partial first months
- **Overage Rate**: Usage beyond the included amount is billed at 0.5% of monthly server cost per GB
- **Automated Processing**: Overages are automatically calculated and charged at the end of each billing period
- **Transparent Reporting**: All bandwidth charges clearly labeled in transaction history
- **One-click Access**: View detailed bandwidth statistics directly from server control panel

### Technical Implementation
- Bandwidth data collected hourly via server metrics
- Aggregated daily for efficient storage and reporting
- Intelligent calculation based on server-specific periods
- Automatic unit conversion for clear data presentation (MB/GB/TB)
- Enhanced error handling for more reliable monitoring

## ⚙️ System Administration

### Mock Mode for Development
The system can run in mock mode without actual DigitalOcean API calls:

- **FORCE_MOCK_FIREWALLS=true**: Use simulated firewall data
- **Missing API Key**: Automatically switches to full mock mode

### Database Migrations
- Schema changes managed through Drizzle migrations
- Automatic migration execution on startup
- Migration history tracked for rollback capability

### Error Monitoring
- Comprehensive error logging system
- Admin notification for critical errors
- Performance anomaly detection

## 🔒 Security Considerations

### Data Protection
- Passwords stored with bcrypt hashing
- Session management with secure cookies
- CSRF protection on all forms
- SQL injection prevention through ORM

### Server Access Security
- SSH keys for secure server access
- Firewall rules for traffic control
- Brute force prevention
- IP banning for security threats

### Payment Security
- PayPal handles all payment processing
- No credit card data stored on platform
- Secure WebHook validation

## 🤝 Contributing to CloudRack

We welcome contributions to improve CloudRack! To contribute:

1. Fork the repository
2. Create a feature branch
3. Implement your changes with appropriate tests
4. Submit a pull request with a clear description

Please follow our coding standards and include tests for new features.

## 📝 License

CloudRack is licensed under the MIT License. See the LICENSE file for details.