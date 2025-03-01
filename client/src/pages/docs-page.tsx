import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Wifi
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
  content: string;
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
        title: "Welcome to CloudHost",
        content: `# Welcome to CloudHost VPS Platform
        
This guide will help you get started with our VPS hosting platform. CloudHost provides high-performance virtual private servers with easy deployment options and full control.

## What You Can Do with CloudHost

- Deploy virtual servers across multiple global regions
- Choose from various Linux distributions and application templates
- Configure firewall rules for enhanced security
- Attach additional storage volumes for scalability
- Monitor server performance metrics in real-time
- Access servers via SSH and web console

Let's get you started on your cloud hosting journey!`,
        order: 1,
        lastUpdated: "2023-07-15"
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
    id: "storage",
    title: "Storage & Volumes",
    order: 4,
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

  // Simple markdown-like parsing for content display
  const formatContent = (content: string) => {
    // Parse headers
    let formattedContent = content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$1</h3>')
      // Parse code blocks
      .replace(/```([^`]+)```/g, '<pre class="bg-muted p-3 rounded-md my-4 overflow-x-auto text-sm font-mono">$1</pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Parse lists
      .replace(/^\s*[\-\*]\s(.*)$/gm, '<li class="ml-4 mb-1">$1</li>')
      // Parse paragraphs
      .replace(/^(?!<[hl\d]|<pre|<li)(.*$)/gm, (match) => {
        if (match.trim() === '') return '<br>';
        return `<p class="mb-3">${match}</p>`;
      });

    return { __html: formattedContent };
  };

  return (
    <div className="prose prose-zinc dark:prose-invert max-w-none">
      <div className="mb-4 pb-4 border-b flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{article.title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {article.lastUpdated}</p>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <ExternalLink className="h-4 w-4" />
          <span>Print</span>
        </Button>
      </div>
      <div dangerouslySetInnerHTML={formatContent(article.content)} />
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
              className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-medium hover:bg-muted rounded-md transition-colors"
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
                      activeArticleId === article.id ? 'bg-muted font-medium' : 'text-muted-foreground'
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
  
  // Get the active article from the mock data
  const activeArticle = activeArticleId 
    ? mockSections
        .flatMap(section => section.children)
        .find(article => article.id === activeArticleId) || null
    : null;
  
  // Check for admin access to show the editor tab
  const isAdmin = user?.isAdmin;
  
  return (
    <div className="container py-8">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Documentation Sidebar */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="p-4">
                  <DocSidebar 
                    sections={mockSections} 
                    activeArticleId={activeArticleId}
                    setActiveArticleId={setActiveArticleId}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Documentation Content */}
            <div className="md:col-span-3">
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
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Section
                        </Button>
                      </div>
                      
                      <div className="border rounded-md divide-y">
                        {mockSections.map(section => (
                          <div key={section.id} className="p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{section.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {section.children.length} articles
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-500">
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
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Article
                        </Button>
                      </div>
                      
                      <div className="border rounded-md divide-y">
                        {mockSections.flatMap(section => 
                          section.children.map(article => (
                            <div key={article.id} className="p-4 flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{article.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Section: {section.title} | Last updated: {article.lastUpdated}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-500">
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
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}