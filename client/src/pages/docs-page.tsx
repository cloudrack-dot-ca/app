import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "react-simple-wysiwyg";
import {
  ChevronDown,
  ChevronRight,
  Book,
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Server,
  Shield,
  HardDrive,
  Terminal,
  Cpu,
  Wifi,
  Save
} from "lucide-react";

// Documentation section types
interface DocSection {
  id: string;
  title: string;
  order: number;
  children: DocArticle[];
}

interface DocArticle {
  id: string;
  sectionId: string;
  title: string;
  content: string; // Now contains HTML content instead of Markdown
  order: number;
  lastUpdated: string;
}

// Mock data for documentation sections and articles
const mockSections: DocSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    order: 1,
    children: [
      {
        id: "welcome",
        sectionId: "getting-started",
        title: "Welcome to CloudRack",
        content: `<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">Welcome to CloudRack VPS Platform</h1>
<p class="mb-3 text-foreground">This guide will help you get started with our VPS hosting platform. CloudRack provides high-performance virtual private servers with easy deployment options and full control.</p>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">What You Can Do with CloudRack</h2>

<ul>
  <li class="ml-4 mb-1 text-foreground">Deploy virtual servers across multiple global regions</li>
  <li class="ml-4 mb-1 text-foreground">Choose from various Linux distributions and application templates</li>
  <li class="ml-4 mb-1 text-foreground">Configure firewall rules for enhanced security</li>
  <li class="ml-4 mb-1 text-foreground">Attach additional storage volumes for scalability</li>
  <li class="ml-4 mb-1 text-foreground">Monitor server performance metrics in real-time</li>
  <li class="ml-4 mb-1 text-foreground">Access servers via SSH and web console</li>
  <li class="ml-4 mb-1 text-foreground">Track bandwidth usage with intuitive visualization tools</li>
  <li class="ml-4 mb-1 text-foreground">Manage servers with server-specific billing periods</li>
</ul>

<p class="mb-3 text-foreground">Let's get you started on your cloud hosting journey!</p>`,
        order: 1,
        lastUpdated: "2025-03-02"
      },
      {
        id: "quick-start",
        sectionId: "getting-started",
        title: "Quick Start Guide",
        content: `# Quick Start Guide

Follow these simple steps to launch your first server on CloudHost:

1. **Sign up for an account**: Create your account with a unique username and secure password.

2. **Add funds to your account**: Navigate to the Billing page and add credit to your account.

3. **Create your first server**:
   - Go to the Dashboard
   - Click "Create Server"
   - Select your preferred region, size, and operating system
   - Provide a name for your server
   - Click "Create" to deploy your server

4. **Connect to your server**:
   - Once deployed, go to the server details page
   - Use the SSH command provided or the web console
   - For SSH, make sure you've added your SSH key in the SSH Keys section

5. **Configure your server**:
   - Update packages: \`apt update && apt upgrade -y\`
   - Install your applications
   - Configure firewall rules as needed

Your server is now ready to use!`,
        order: 2,
        lastUpdated: "2023-08-03"
      }
    ]
  },
  {
    id: "servers",
    title: "Server Management",
    order: 2,
    children: [
      {
        id: "server-creation",
        sectionId: "servers",
        title: "Creating Servers",
        content: `# Creating Servers

CloudHost makes it easy to create and deploy virtual private servers in multiple regions around the world.

## Server Creation Process

1. **Navigate to the Dashboard**: This is your control center for all your cloud resources.

2. **Click "Create Server"**: This button is prominently displayed on the dashboard.

3. **Choose Server Specifications**:
   - **Region**: Select the geographic location closest to your target audience
   - **Size**: Choose the appropriate CPU, RAM, and storage configuration
   - **Operating System**: Select from various Linux distributions
   - **Application**: Optionally select a pre-configured application stack

4. **Configure Server Details**:
   - **Server Name**: Give your server a descriptive name
   - **SSH Keys**: Select SSH keys for secure access
   - **Initial Password**: Set an initial root password (optional)

5. **Review and Create**: Verify all settings and click "Create Server"

Your server will be provisioned within minutes and will appear in your dashboard with its status, IP address, and other details.

## Server Sizes and Pricing

Server pricing is based on the resources allocated and is charged hourly. You can see the exact pricing for each configuration during the server creation process.

## Recommended Configurations

- **Web Server**: 2GB RAM, 1 vCPU
- **Database Server**: 4GB RAM, 2 vCPU
- **Application Server**: 8GB RAM, 4 vCPU
- **Game Server**: 16GB RAM, 6 vCPU

Choose the configuration that best fits your workload requirements.`,
        order: 1,
        lastUpdated: "2023-09-12"
      },
      {
        id: "server-access",
        sectionId: "servers",
        title: "Accessing Your Server",
        content: `# Accessing Your Server

There are multiple ways to access and manage your CloudHost VPS.

## SSH Access

The most common method for server administration is SSH (Secure Shell). To connect via SSH:

\`\`\`bash
ssh root@your_server_ip
\`\`\`

For security, we recommend using SSH key authentication:

1. First, add your SSH public key in the SSH Keys section of your account
2. When creating a server, select your SSH key
3. Connect without a password using: \`ssh -i /path/to/private_key root@your_server_ip\`

## Web Console

For times when SSH isn't available, we provide a web-based console:

1. Navigate to your server's detail page
2. Click on the "Console" tab
3. Use the web terminal interface to interact with your server

This is especially useful for emergency access or when firewall configurations might be blocking SSH.

## SFTP/SCP for File Transfer

To transfer files to and from your server:

- Use SFTP: \`sftp root@your_server_ip\`
- Or SCP: \`scp file.txt root@your_server_ip:/path/to/destination\`

These methods use the same authentication as SSH, so your SSH keys will work here too.`,
        order: 2,
        lastUpdated: "2023-09-15"
      }
    ]
  },
  {
    id: "security",
    title: "Security",
    order: 3,
    children: [
      {
        id: "firewall",
        sectionId: "security",
        title: "Firewall Configuration",
        content: `# Firewall Configuration

Securing your server with proper firewall rules is essential for protecting your applications and data.

## CloudHost Firewall System

Our platform provides an easy-to-use firewall management interface that lets you control inbound and outbound traffic to your servers.

### Accessing Firewall Settings

1. Navigate to your server's detail page
2. Go to the "Overview" tab
3. Find the "Firewall" section
4. Click "Configure Firewall" to manage rules

### Default Rules

By default, we allow:
- SSH (port 22) - for server administration
- HTTP (port 80) - for web traffic
- HTTPS (port 443) - for secure web traffic

### Adding Rules

To add a new rule:
1. Select the rule type (inbound or outbound)
2. Select the protocol (TCP, UDP, or ICMP)
3. Specify the port number or range
4. Define the source IP addresses (for inbound) or destination addresses (for outbound)
5. Click "Add Rule"

### Common Firewall Configurations

- **Web Server**: Allow ports 80, 443, and 22
- **Database Server**: Allow specific port (MySQL: 3306, PostgreSQL: 5432) only from your application servers
- **Game Server**: Allow specific game port plus port 22 for administration

### Best Practices

- Only open ports that are necessary for your application
- Restrict administrative access (SSH) to specific IP addresses when possible
- Regularly audit your firewall rules and remove unnecessary access
- Consider using a VPN for administrative access to avoid exposing management ports

Remember that firewall security is just one aspect of a comprehensive security strategy. Also consider keeping your software updated, using strong passwords, and implementing proper access controls.`,
        order: 1,
        lastUpdated: "2023-10-05"
      },
      {
        id: "ssh-keys",
        sectionId: "security",
        title: "Managing SSH Keys",
        content: `# Managing SSH Keys

SSH keys provide a more secure way to log into your servers compared to password authentication.

## How SSH Keys Work

SSH keys come in pairs:
- **Public key**: Added to the server and acts like a lock
- **Private key**: Kept securely on your computer and acts like a key

When the keys match, you're granted access without needing a password.

## Adding SSH Keys to Your Account

1. Navigate to the SSH Keys section in your account
2. Click "Add SSH Key"
3. Provide a name for your key (e.g., "Work Laptop")
4. Paste your public key (usually found in \`~/.ssh/id_rsa.pub\` or similar)
5. Click "Save"

## Generating SSH Keys

If you don't have SSH keys yet, you can generate them:

**On Linux/macOS**:
\`\`\`bash
ssh-keygen -t rsa -b 4096
\`\`\`

**On Windows**:
Use PuTTYgen or the SSH key generation tool in your SSH client.

## Using SSH Keys with Servers

When creating a new server:
1. In the server creation form, you'll see a section for SSH Keys
2. Select the keys you want to add to this server
3. The selected keys will be automatically added to the server's \`authorized_keys\` file

## Managing Keys on Existing Servers

You can add or remove SSH keys from existing servers:
1. Go to the server detail page
2. Navigate to the "SSH Keys" section
3. Add or remove keys as needed

## Best Practices

- Never share your private key
- Use a passphrase when generating your SSH key
- Consider using different keys for different servers or environments
- Regularly audit and rotate your SSH keys
- Immediately remove access for compromised keys`,
        order: 2,
        lastUpdated: "2023-08-22"
      }
    ]
  },
  {
    id: "billing",
    title: "Billing & Bandwidth",
    order: 4,
    children: [
      {
        id: "bandwidth-monitoring",
        sectionId: "billing",
        title: "Bandwidth Monitoring & Billing",
        content: `<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">Bandwidth Monitoring & Billing</h1>

<p class="mb-3 text-foreground">CloudRack provides comprehensive bandwidth monitoring and a transparent billing system to help you manage your server's network usage effectively.</p>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Understanding Bandwidth Allocation</h2>

<p class="mb-3 text-foreground">Each server comes with a generous bandwidth allocation:</p>

<ul>
  <li class="ml-4 mb-1 text-foreground">Every server includes 1TB (1000GB) of outbound transfer per month</li>
  <li class="ml-4 mb-1 text-foreground">Bandwidth is calculated from each server's creation date, not calendar month</li>
  <li class="ml-4 mb-1 text-foreground">For new servers, bandwidth allocation is prorated for the first partial month</li>
  <li class="ml-4 mb-1 text-foreground">Both inbound and outbound traffic are monitored, but only outbound counts toward your limit</li>
</ul>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Accessing Bandwidth Information</h2>

<p class="mb-3 text-foreground">To view your bandwidth usage:</p>

<ol>
  <li class="ml-4 mb-1 text-foreground">Navigate to your server's detail page</li>
  <li class="ml-4 mb-1 text-foreground">Click the "View Bandwidth" button in the Server Controls section</li>
  <li class="ml-4 mb-1 text-foreground">Alternatively, go to the Networking tab and find the bandwidth monitoring section</li>
</ol>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Bandwidth Dashboard Features</h2>

<ul>
  <li class="ml-4 mb-1 text-foreground"><strong>Usage Bar</strong>: Visual indicator of your current usage relative to your limit</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Detailed Charts</strong>: Daily and hourly breakdowns of your bandwidth consumption</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Inbound/Outbound Tracking</strong>: Separate tracking for incoming and outgoing traffic</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Adaptive Units</strong>: Values automatically display in MB for small amounts, scaling to GB or TB as needed</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Billing Period Indicators</strong>: Clear display of your current billing period dates</li>
</ul>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Bandwidth Overage Billing</h2>

<p class="mb-3 text-foreground">If you exceed your included bandwidth allocation:</p>

<ul>
  <li class="ml-4 mb-1 text-foreground">Overage is calculated at 0.5% of your monthly server cost per GB</li>
  <li class="ml-4 mb-1 text-foreground">Charges are automatically applied at the end of your server's billing period</li>
  <li class="ml-4 mb-1 text-foreground">All bandwidth charges appear in your transaction history with detailed descriptions</li>
</ul>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Bandwidth Management Tips</h2>

<ul>
  <li class="ml-4 mb-1 text-foreground">Set up monitoring alerts to notify you when approaching your bandwidth limit</li>
  <li class="ml-4 mb-1 text-foreground">Use a CDN for static content to reduce outbound traffic from your server</li>
  <li class="ml-4 mb-1 text-foreground">Implement caching strategies to minimize redundant data transfers</li>
  <li class="ml-4 mb-1 text-foreground">Consider compressing API responses and web content</li>
  <li class="ml-4 mb-1 text-foreground">For high-traffic applications, consider distributing load across multiple servers</li>
</ul>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Understanding Bandwidth Metrics</h2>

<p class="mb-3 text-foreground">CloudRack provides several bandwidth metrics:</p>

<ul>
  <li class="ml-4 mb-1 text-foreground"><strong>Current Usage</strong>: Total bandwidth consumed in the current billing period</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Daily Usage</strong>: Breakdown of bandwidth consumption by day</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Projected Usage</strong>: Estimated total usage based on current trends</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Peak Traffic</strong>: Highest bandwidth consumption periods</li>
</ul>

<p class="mb-3 text-foreground">Regular monitoring of these metrics can help you optimize your application and control costs.</p>`,
        order: 1,
        lastUpdated: "2025-03-02"
      },
      {
        id: "billing-system",
        sectionId: "billing",
        title: "Account Billing & Payments",
        content: `<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">Account Billing & Payments</h1>

<p class="mb-3 text-foreground">CloudRack uses a transparent pay-as-you-go billing model that charges only for the resources you use.</p>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Billing Model</h2>

<ul>
  <li class="ml-4 mb-1 text-foreground"><strong>Hourly Billing</strong>: Servers are billed by the hour, allowing precise control over costs</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Pro-rated Charges</strong>: You only pay for the hours your resources are active</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Server-specific Billing Periods</strong>: Each server has its own billing cycle based on creation date</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Volume Storage</strong>: Block storage is billed at a fixed rate per GB per month</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Bandwidth Overages</strong>: Only charged if you exceed your included allocation</li>
</ul>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Adding Account Credit</h2>

<p class="mb-3 text-foreground">To add funds to your account:</p>

<ol>
  <li class="ml-4 mb-1 text-foreground">Navigate to the Billing page</li>
  <li class="ml-4 mb-1 text-foreground">Click "Add Credit"</li>
  <li class="ml-4 mb-1 text-foreground">Enter the amount you wish to add</li>
  <li class="ml-4 mb-1 text-foreground">Complete the payment process via PayPal</li>
</ol>

<p class="mb-3 text-foreground">We recommend maintaining sufficient account balance to cover at least one month of usage.</p>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Transaction History</h2>

<p class="mb-3 text-foreground">Your transaction history provides detailed records of all charges and payments:</p>

<ul>
  <li class="ml-4 mb-1 text-foreground"><strong>Deposits</strong>: All funds added to your account</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Server Charges</strong>: Hourly server usage fees</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Volume Charges</strong>: Block storage fees</li>
  <li class="ml-4 mb-1 text-foreground"><strong>Bandwidth Charges</strong>: Any bandwidth overage fees</li>
</ul>

<p class="mb-3 text-foreground">Each entry includes a timestamp, description, amount, and status.</p>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Billing Alerts</h2>

<p class="mb-3 text-foreground">CloudRack monitors your account balance and provides alerts:</p>

<ul>
  <li class="ml-4 mb-1 text-foreground">Low balance warnings when your account balance falls below estimated monthly usage</li>
  <li class="ml-4 mb-1 text-foreground">Automatic reminder emails when balance is critically low</li>
  <li class="ml-4 mb-1 text-foreground">Notifications of upcoming bandwidth overages</li>
</ul>

<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">Payment Methods</h2>

<p class="mb-3 text-foreground">CloudRack currently supports the following payment methods:</p>

<ul>
  <li class="ml-4 mb-1 text-foreground">PayPal</li>
  <li class="ml-4 mb-1 text-foreground">Credit/Debit cards (via PayPal)</li>
</ul>

<p class="mb-3 text-foreground">All payment processing is handled securely through PayPal's infrastructure. CloudRack does not store your payment details.</p>`,
        order: 2,
        lastUpdated: "2025-03-02"
      }
    ]
  },
  {
    id: "storage",
    title: "Storage & Volumes",
    order: 5,
    children: [
      {
        id: "volumes",
        sectionId: "storage",
        title: "Managing Block Storage Volumes",
        content: `# Managing Block Storage Volumes

Block storage volumes provide additional disk space that can be attached to your servers.

## Benefits of Block Storage

- **Scalability**: Add storage capacity without upgrading your entire server
- **Flexibility**: Attach and detach volumes between servers as needed
- **Data Persistence**: Keep your data even if you delete your server
- **Performance**: SSD-backed storage for fast read/write operations

## Creating a Volume

1. Navigate to your server's detail page
2. Go to the "Volumes" tab
3. Click "Create Volume"
4. Specify:
   - Volume name
   - Size (in GB)
   - File system type (optional)
5. Click "Create"

The volume will be automatically attached to your server.

## Using a Newly Created Volume

Once created, you need to prepare the volume for use:

1. Connect to your server via SSH
2. List block devices to find your volume: \`lsblk\`
3. Format the volume if it's new: \`mkfs.ext4 /dev/disk/by-id/scsi-0DO_Volume_volume-name\`
4. Create a mount point: \`mkdir -p /mnt/volume-name\`
5. Mount the volume: \`mount /dev/disk/by-id/scsi-0DO_Volume_volume-name /mnt/volume-name\`
6. To mount automatically at boot, add to \`/etc/fstab\`:
   \`/dev/disk/by-id/scsi-0DO_Volume_volume-name /mnt/volume-name ext4 defaults,nofail 0 2\`

## Resizing Volumes

To increase a volume's size:

1. Navigate to the Volumes tab
2. Find the volume you want to resize
3. Click "Resize"
4. Enter the new size (must be larger than the current size)
5. Click "Resize Volume"

After resizing in the control panel, you need to expand the file system on your server:

\`\`\`bash
# For ext4 file systems
resize2fs /dev/disk/by-id/scsi-0DO_Volume_volume-name

# For xfs file systems
xfs_growfs /mount/point
\`\`\`

## Detaching and Attaching Volumes

You can detach a volume from one server and attach it to another:

1. First, unmount the volume on the current server:
   \`umount /mnt/volume-name\`
2. In the control panel, go to the Volumes tab
3. Click "Detach" for the volume
4. Navigate to the server you want to attach it to
5. Go to its Volumes tab
6. Click "Attach Existing Volume"
7. Select the volume from the list
8. Click "Attach"

Remember to mount the volume on the new server after attaching.`,
        order: 1,
        lastUpdated: "2023-07-28"
      }
    ]
  },
];

// Documentation article viewer component
const ArticleViewer = ({ article }: { article: DocArticle | null }) => {
  if (!article) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Select an article to view</p>
      </div>
    );
  }

  // Process HTML content for display
  const formatContent = (content: string) => {
    // Check if content is already HTML (starts with HTML tags)
    // If not, convert from markdown format for backward compatibility
    if (!content.trim().startsWith('<')) {
      // Convert legacy markdown to HTML
      let formattedContent = content
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">$1</h1>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3 text-foreground">$1</h2>')
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mt-4 mb-2 text-foreground">$1</h3>')
        // Parse code blocks
        .replace(/```([^`]+)```/g, '<pre class="bg-muted p-3 rounded-md my-4 overflow-x-auto text-sm font-mono text-foreground">$1</pre>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">$1</code>')
        // Parse lists
        .replace(/^\s*[\-\*]\s(.*)$/gm, '<li class="ml-4 mb-1 text-foreground">$1</li>')
        // Parse paragraphs
        .replace(/^(?!<[hl\d]|<pre|<li)(.*$)/gm, (match) => {
          if (match.trim() === '') return '<br>';
          return `<p class="mb-3 text-foreground">${match}</p>`;
        });
      
      return { __html: formattedContent };
    }
    
    // Content is already HTML, return as is
    return { __html: content };
  };

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none text-foreground">
      <div className="mb-4 pb-4 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{article.title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {article.lastUpdated}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 self-start sm:self-auto"
          onClick={() => {
            // Open print dialog
            window.print();
          }}
        >
          <ExternalLink className="h-4 w-4" />
          <span>Print</span>
        </Button>
      </div>
      <div dangerouslySetInnerHTML={formatContent(article.content)} className="overflow-x-auto" />
    </div>
  );
};

// Documentation sidebar component
const DocSidebar = ({ 
  sections, 
  activeArticleId, 
  setActiveArticleId 
}: { 
  sections: DocSection[], 
  activeArticleId: string | null,
  setActiveArticleId: (id: string) => void
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize with all sections expanded
  useEffect(() => {
    const expanded: Record<string, boolean> = {};
    sections.forEach(section => {
      expanded[section.id] = true;
    });
    setExpandedSections(expanded);
  }, [sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Filter sections/articles based on search query
  const filteredSections = searchQuery.trim() === '' 
    ? sections 
    : sections.map(section => {
        const filteredChildren = section.children.filter(article => 
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { ...section, children: filteredChildren };
      }).filter(section => section.children.length > 0);

  return (
    <div className="w-full">
      <div className="mb-4 relative">
        <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        <Input 
          placeholder="Search documentation..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="space-y-1">
        {filteredSections.map(section => (
          <div key={section.id} className="mb-2">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium hover:bg-muted rounded-md transition-colors text-foreground"
            >
              <span>{section.title}</span>
              {expandedSections[section.id] ? 
                <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              }
            </button>
            
            {expandedSections[section.id] && (
              <div className="mt-1 ml-2 space-y-1 border-l-2 border-muted">
                {section.children.map(article => (
                  <button
                    key={article.id}
                    onClick={() => setActiveArticleId(article.id)}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted rounded-md transition-colors ${
                      activeArticleId === article.id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {article.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Documentation Page Component
export default function DocsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("documentation");
  const [activeArticleId, setActiveArticleId] = useState<string | null>("welcome");
  
  // State for sections and articles
  const [sections, setSections] = useState<DocSection[]>(mockSections);
  
  // State for editing
  const [editSectionDialogOpen, setEditSectionDialogOpen] = useState(false);
  const [editArticleDialogOpen, setEditArticleDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<DocSection | null>(null);
  const [currentArticle, setCurrentArticle] = useState<DocArticle | null>(null);
  const [isNewSection, setIsNewSection] = useState(false);
  const [isNewArticle, setIsNewArticle] = useState(false);
  
  // Form state
  const [sectionTitle, setSectionTitle] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleSectionId, setArticleSectionId] = useState("");
  
  // Get the active article from the sections data
  const activeArticle = activeArticleId 
    ? sections
        .flatMap(section => section.children)
        .find(article => article.id === activeArticleId) || null
    : null;
  
  // Check for admin access to show the editor tab
  const isAdmin = user?.isAdmin;
  
  // Helper function to generate a simple ID
  const generateId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };
  
  // Current date formatter for last updated field
  const getCurrentDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  
  // Handler for saving a section
  const handleSaveSection = () => {
    if (!sectionTitle.trim()) return;
    
    if (isNewSection) {
      // Create a new section
      const newSection: DocSection = {
        id: generateId('section'),
        title: sectionTitle,
        order: sections.length + 1,
        children: []
      };
      
      setSections([...sections, newSection]);
      toast({
        title: "Section Created",
        description: `The section "${sectionTitle}" has been created.`,
      });
    } else if (currentSection) {
      // Update existing section
      const updatedSections = sections.map(section => 
        section.id === currentSection.id 
          ? { ...section, title: sectionTitle }
          : section
      );
      
      setSections(updatedSections);
      toast({
        title: "Section Updated",
        description: `The section has been updated.`,
      });
    }
    
    setEditSectionDialogOpen(false);
  };
  
  // Handler for saving an article
  const handleSaveArticle = () => {
    if (!articleTitle.trim() || !articleContent.trim() || !articleSectionId) return;
    
    const currentDate = getCurrentDate();
    
    if (isNewArticle) {
      // Create a new article
      const newArticle: DocArticle = {
        id: generateId('article'),
        sectionId: articleSectionId,
        title: articleTitle,
        content: articleContent,
        order: sections.find(s => s.id === articleSectionId)?.children.length ?? 0 + 1,
        lastUpdated: currentDate
      };
      
      const updatedSections = sections.map(section => 
        section.id === articleSectionId
          ? { ...section, children: [...section.children, newArticle] }
          : section
      );
      
      setSections(updatedSections);
      toast({
        title: "Article Created",
        description: `The article "${articleTitle}" has been created.`,
      });
    } else if (currentArticle) {
      // Update existing article
      const updatedSections = sections.map(section => {
        // If this is the section that currently contains the article
        if (section.id === currentArticle.sectionId) {
          // Handle case where article is moved to a different section
          if (articleSectionId !== currentArticle.sectionId) {
            // Remove article from its current section
            return {
              ...section,
              children: section.children.filter(a => a.id !== currentArticle.id)
            };
          }
          
          // Update article in its current section
          return {
            ...section,
            children: section.children.map(article => 
              article.id === currentArticle.id
                ? { 
                    ...article, 
                    title: articleTitle, 
                    content: articleContent, 
                    lastUpdated: currentDate 
                  }
                : article
            )
          };
        } 
        // If this is the target section for article to be moved to
        else if (section.id === articleSectionId && articleSectionId !== currentArticle.sectionId) {
          // Add the article to its new section
          return {
            ...section,
            children: [
              ...section.children,
              { 
                ...currentArticle, 
                sectionId: articleSectionId,
                title: articleTitle, 
                content: articleContent, 
                lastUpdated: currentDate 
              }
            ]
          };
        }
        // Other sections remain unchanged
        return section;
      });
      
      setSections(updatedSections);
      toast({
        title: "Article Updated",
        description: `The article has been updated.`,
      });
    }
    
    setEditArticleDialogOpen(false);
  };
  
  // Handler for deleting a section
  const handleDeleteSection = (sectionId: string) => {
    if (confirm("Are you sure you want to delete this section? All articles in this section will also be deleted.")) {
      const updatedSections = sections.filter(section => section.id !== sectionId);
      setSections(updatedSections);
      
      // If the active article was in this section, reset active article
      const sectionArticleIds = sections
        .find(s => s.id === sectionId)
        ?.children.map(a => a.id) || [];
      
      if (activeArticleId && sectionArticleIds.includes(activeArticleId)) {
        setActiveArticleId(updatedSections[0]?.children[0]?.id || null);
      }
      
      toast({
        title: "Section Deleted",
        description: "The section and all its articles have been deleted.",
      });
    }
  };
  
  // Handler for deleting an article
  const handleDeleteArticle = (articleId: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      const updatedSections = sections.map(section => ({
        ...section,
        children: section.children.filter(article => article.id !== articleId)
      }));
      
      setSections(updatedSections);
      
      // If this was the active article, reset active article
      if (activeArticleId === articleId) {
        setActiveArticleId(updatedSections[0]?.children[0]?.id || null);
      }
      
      toast({
        title: "Article Deleted",
        description: "The article has been deleted.",
      });
    }
  };
  
  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center text-foreground">
          <Book className="mr-2 h-8 w-8" />
          Documentation
        </h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="documentation">
            <FileText className="h-4 w-4 mr-2" />
            Documentation
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="editor">
              <Edit className="h-4 w-4 mr-2" />
              Editor
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="documentation" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Documentation Sidebar */}
            <div className="md:col-span-3">
              <Card>
                <CardContent className="p-4">
                  <DocSidebar 
                    sections={sections} 
                    activeArticleId={activeArticleId}
                    setActiveArticleId={setActiveArticleId}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Documentation Content */}
            <div className="md:col-span-9">
              <Card>
                <CardContent className="p-6">
                  <ArticleViewer article={activeArticle} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Admin Documentation Editor */}
        {isAdmin && (
          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <CardTitle>Documentation Editor</CardTitle>
                <CardDescription>
                  Manage documentation sections and articles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sections">
                  <TabsList className="mb-4">
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                    <TabsTrigger value="articles">Articles</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sections">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Documentation Sections</h3>
                        <Button onClick={() => {
                          setIsNewSection(true);
                          setCurrentSection(null);
                          setSectionTitle("");
                          setEditSectionDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Section
                        </Button>
                      </div>
                      
                      <div className="border rounded-md divide-y">
                        {sections.map(section => (
                          <div key={section.id} className="p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{section.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {section.children.length} articles
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setIsNewSection(false);
                                  setCurrentSection(section);
                                  setSectionTitle(section.title);
                                  setEditSectionDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500"
                                onClick={() => handleDeleteSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="articles">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Documentation Articles</h3>
                        <Button onClick={() => {
                          setIsNewArticle(true);
                          setCurrentArticle(null);
                          setArticleTitle("");
                          setArticleContent("");
                          setArticleSectionId(sections[0]?.id || "");
                          setEditArticleDialogOpen(true);
                        }}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Article
                        </Button>
                      </div>
                      
                      <div className="border rounded-md divide-y">
                        {sections.flatMap(section => 
                          section.children.map(article => (
                            <div key={article.id} className="p-4 flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{article.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Section: {section.title} | Last updated: {article.lastUpdated}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setIsNewArticle(false);
                                    setCurrentArticle(article);
                                    setArticleTitle(article.title);
                                    setArticleContent(article.content);
                                    setArticleSectionId(article.sectionId);
                                    setEditArticleDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-500"
                                  onClick={() => handleDeleteArticle(article.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* Section Edit Dialog */}
            <Dialog open={editSectionDialogOpen} onOpenChange={setEditSectionDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isNewSection ? "Add Section" : "Edit Section"}</DialogTitle>
                  <DialogDescription>
                    {isNewSection ? "Create a new documentation section" : "Update section details"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="section-title">Section Title</Label>
                    <Input 
                      id="section-title" 
                      value={sectionTitle} 
                      onChange={(e) => setSectionTitle(e.target.value)}
                      placeholder="e.g., Getting Started"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditSectionDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSaveSection}
                    disabled={!sectionTitle.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isNewSection ? "Create Section" : "Update Section"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Article Edit Dialog */}
            <Dialog open={editArticleDialogOpen} onOpenChange={setEditArticleDialogOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{isNewArticle ? "Add Article" : "Edit Article"}</DialogTitle>
                  <DialogDescription>
                    {isNewArticle ? "Create a new documentation article" : "Update article content"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="article-section">Section</Label>
                    <select
                      id="article-section"
                      value={articleSectionId}
                      onChange={(e) => setArticleSectionId(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article-title">Article Title</Label>
                    <Input 
                      id="article-title" 
                      value={articleTitle} 
                      onChange={(e) => setArticleTitle(e.target.value)}
                      placeholder="e.g., Getting Started with CloudHost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="article-content">Content (HTML Editor)</Label>
                    <div className="border rounded-md">
                      <RichTextEditor
                        id="article-content"
                        value={articleContent}
                        onChange={(e) => setArticleContent(e.target.value)}
                        className="min-h-[400px] w-full bg-background p-4"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditArticleDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSaveArticle}
                    disabled={!articleTitle.trim() || !articleContent.trim() || !articleSectionId}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isNewArticle ? "Create Article" : "Update Article"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}