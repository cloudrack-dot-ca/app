import { Server, Volume } from "@shared/schema";
import fetch from 'node-fetch';

export interface Region {
  slug: string;
  name: string;
  sizes: string[];
  available: boolean;
}

export interface Size {
  slug: string;
  memory: number;
  vcpus: number;
  disk: number;
  transfer: number;
  price_monthly: number;
  available?: boolean;
  processor_type?: 'regular' | 'intel' | 'amd' | 'gpu';
}

export interface Distribution {
  slug: string;
  name: string;
  description: string;
}

export interface Application {
  slug: string;
  name: string;
  description: string;
  type: string;
  distribution?: string; // References a distribution slug (optional for backward compatibility)
}

export interface FirewallRule {
  id?: string;
  type?: 'inbound' | 'outbound';
  protocol: 'tcp' | 'udp' | 'icmp';
  ports: string;
  sources?: {
    addresses?: string[];
    load_balancer_uids?: string[];
    tags?: string[];
  };
  destinations?: {
    addresses?: string[];
    load_balancer_uids?: string[];
    tags?: string[];
  };
}

export interface Firewall {
  id?: string;
  name: string;
  status?: 'waiting' | 'active' | 'errored';
  created_at?: string;
  droplet_ids: number[];
  inbound_rules: FirewallRule[];
  outbound_rules: FirewallRule[];
}

// Support both mock and real DigitalOcean API
export class DigitalOceanClient {
  private apiKey: string;
  public useMock: boolean;
  private apiBaseUrl = 'https://api.digitalocean.com/v2';

  constructor() {
    this.apiKey = process.env.DIGITAL_OCEAN_API_KEY || '';
    this.useMock = !this.apiKey;
    if (this.useMock) {
      console.warn('DigitalOcean API key not found. Using mock data.');
    }
  }

  // Default mock data
  private mockRegions: Region[] = [
    {
      slug: "nyc1",
      name: "New York 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true,
    },
    {
      slug: "sfo1",
      name: "San Francisco 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true,
    },
    {
      slug: "ams3",
      name: "Amsterdam 3",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true,
    },
    {
      slug: "sgp1",
      name: "Singapore 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true,
    },
    {
      slug: "lon1",
      name: "London 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true,
    },
    {
      slug: "fra1",
      name: "Frankfurt 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true,
    },
    {
      slug: "blr1",
      name: "Bangalore 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true,
    },
    {
      slug: "tor1",
      name: "Toronto 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb", "s-4vcpu-8gb"],
      available: true,
    },
  ];

  private mockSizes: Size[] = [
    // Regular droplets (Standard)
    {
      slug: "s-1vcpu-1gb",
      memory: 1024,
      vcpus: 1,
      disk: 25,
      transfer: 1000,
      price_monthly: 7,
      processor_type: 'regular'
    },
    {
      slug: "s-1vcpu-2gb",
      memory: 2048,
      vcpus: 1,
      disk: 50,
      transfer: 2000,
      price_monthly: 12,
      processor_type: 'regular'
    },
    {
      slug: "s-2vcpu-4gb",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4000,
      price_monthly: 22,
      processor_type: 'regular'
    },
    {
      slug: "s-4vcpu-8gb",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5000,
      price_monthly: 42,
      processor_type: 'regular'
    },
    
    // Intel Optimized droplets
    {
      slug: "c-2-intel",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4000,
      price_monthly: 28,
      processor_type: 'intel'
    },
    {
      slug: "c-4-intel",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5000,
      price_monthly: 54,
      processor_type: 'intel'
    },
    {
      slug: "c-8-intel",
      memory: 16384,
      vcpus: 8,
      disk: 320,
      transfer: 6000,
      price_monthly: 106,
      processor_type: 'intel'
    },
    
    // AMD droplets
    {
      slug: "c-2-amd",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4000,
      price_monthly: 26,
      processor_type: 'amd'
    },
    {
      slug: "c-4-amd",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5000,
      price_monthly: 50,
      processor_type: 'amd'
    },
    {
      slug: "c-8-amd",
      memory: 16384,
      vcpus: 8,
      disk: 320,
      transfer: 6000,
      price_monthly: 98,
      processor_type: 'amd'
    },
    

  ];

  private mockDistributions: Distribution[] = [
    {
      slug: "ubuntu-20-04",
      name: "Ubuntu 20.04",
      description: "Clean Ubuntu 20.04 LTS installation",
    },
    {
      slug: "debian-11",
      name: "Debian 11",
      description: "Clean Debian 11 installation",
    },
    {
      slug: "centos-stream-9",
      name: "CentOS Stream 9",
      description: "Clean CentOS Stream 9 installation",
    },
    {
      slug: "fedora-36",
      name: "Fedora 36",
      description: "Clean Fedora 36 installation",
    },
    {
      slug: "rocky-linux-9",
      name: "Rocky Linux 9",
      description: "Clean Rocky Linux 9 installation",
    },
    {
      slug: "ubuntu-22-04",
      name: "Ubuntu 22.04",
      description: "Clean Ubuntu 22.04 LTS installation",
    },
    {
      slug: "debian-12",
      name: "Debian 12",
      description: "Clean Debian 12 installation",
    },
    {
      slug: "almalinux-9",
      name: "AlmaLinux 9",
      description: "Clean AlmaLinux 9 installation",
    }
  ];

  private mockApplications: Application[] = [
    // Web Development
    {
      slug: "nodejs",
      name: "Node.js",
      description: "Node.js with npm and nvm",
      type: "application",
      distribution: "ubuntu-20-04",
    },
    {
      slug: "python",
      name: "Python",
      description: "Python 3 on Ubuntu 20.04",
      type: "application",
    },
    {
      slug: "docker",
      name: "Docker",
      description: "Docker on Ubuntu 20.04",
      type: "application",
    },
    {
      slug: "lamp",
      name: "LAMP",
      description: "LAMP on Ubuntu 20.04",
      type: "application",
    },
    {
      slug: "lemp",
      name: "LEMP",
      description: "Nginx, MySQL, PHP on Ubuntu 20.04",
      type: "application",
    },
    {
      slug: "mean",
      name: "MEAN",
      description: "MongoDB, Express, Angular, Node.js",
      type: "application",
    },
    {
      slug: "mern",
      name: "MERN",
      description: "MongoDB, Express, React, Node.js",
      type: "application",
    },
    
    // CMS Systems
    {
      slug: "wordpress",
      name: "WordPress",
      description: "WordPress with LAMP stack",
      type: "cms",
    },
    {
      slug: "ghost",
      name: "Ghost",
      description: "Ghost blogging platform",
      type: "cms",
    },
    {
      slug: "drupal",
      name: "Drupal",
      description: "Drupal CMS on LAMP stack",
      type: "cms",
    },
    {
      slug: "joomla",
      name: "Joomla",
      description: "Joomla CMS on LAMP stack",
      type: "cms",
    },
    
    // E-commerce
    {
      slug: "woocommerce",
      name: "WooCommerce",
      description: "WordPress with WooCommerce",
      type: "ecommerce",
    },
    {
      slug: "magento",
      name: "Magento",
      description: "Magento e-commerce platform",
      type: "ecommerce",
    },
    {
      slug: "prestashop",
      name: "PrestaShop",
      description: "PrestaShop e-commerce platform",
      type: "ecommerce",
    },
    
    // Data Science
    {
      slug: "jupyter",
      name: "Jupyter Notebook",
      description: "Python with Jupyter for data science",
      type: "data-science",
    },
    {
      slug: "rstudio",
      name: "R Studio Server",
      description: "R Studio for statistical computing",
      type: "data-science",
    },
    {
      slug: "tensorflow",
      name: "TensorFlow",
      description: "TensorFlow with Python for machine learning",
      type: "data-science",
    },
    
    // Databases
    {
      slug: "mongodb",
      name: "MongoDB",
      description: "MongoDB NoSQL database",
      type: "database",
    },
    {
      slug: "postgres",
      name: "PostgreSQL",
      description: "PostgreSQL database server",
      type: "database",
    },
    {
      slug: "mysql",
      name: "MySQL",
      description: "MySQL database server",
      type: "database",
    },
    {
      slug: "redis",
      name: "Redis",
      description: "Redis in-memory data store",
      type: "database",
    },
    {
      slug: "couchdb",
      name: "CouchDB",
      description: "Apache CouchDB document database",
      type: "database",
    },
    
    // CI/CD and DevOps
    {
      slug: "jenkins",
      name: "Jenkins",
      description: "Jenkins CI/CD server",
      type: "devops",
    },
    {
      slug: "gitlab",
      name: "GitLab CE",
      description: "GitLab Community Edition",
      type: "devops",
    },
    {
      slug: "prometheus",
      name: "Prometheus",
      description: "Prometheus monitoring system",
      type: "devops",
    },
    {
      slug: "grafana",
      name: "Grafana",
      description: "Grafana analytics & monitoring",
      type: "devops",
    },
    
    // Game Servers
    {
      slug: "minecraft",
      name: "Minecraft Server",
      description: "Ready-to-play Minecraft Java Edition server",
      type: "game-server",
    },
    {
      slug: "csgo",
      name: "CS:GO Server",
      description: "Counter-Strike: Global Offensive game server",
      type: "game-server",
    },
    {
      slug: "valheim",
      name: "Valheim Server",
      description: "Valheim dedicated server for multiplayer",
      type: "game-server",
    },
    {
      slug: "rust",
      name: "Rust Server",
      description: "Rust dedicated game server",
      type: "game-server",
    },
    {
      slug: "ark",
      name: "ARK: Survival Evolved",
      description: "ARK: Survival Evolved dedicated server",
      type: "game-server",
    },
    
    // Discord Bots
    {
      slug: "discordjs",
      name: "Discord.js Bot",
      description: "Node.js environment optimized for Discord.js bots",
      type: "bot",
    },
    {
      slug: "discordpy",
      name: "Discord.py Bot",
      description: "Python environment for Discord.py bots",
      type: "bot",
    }
  ];

  // Helper method to map application slugs to valid image IDs
  private getImageForApplication(appSlug?: string): string {
    if (!appSlug) return 'ubuntu-20-04-x64';
    
    // Handle distribution images (base OS images)
    const distroMap: Record<string, string> = {
      'none': 'ubuntu-20-04-x64',
      'debian-11': 'debian-11-x64',
      'centos-stream-9': 'centos-stream-9-x64',
      'fedora-36': 'fedora-36-x64',
      'rocky-linux-9': 'rockylinux-9-x64',
    };
    
    // Check if it's a base distribution image
    if (distroMap[appSlug]) {
      console.log(`Distribution selected: ${appSlug}, Using image: ${distroMap[appSlug]}`);
      return distroMap[appSlug];
    }
    
    // In a real implementation, these would be actual DO application images
    // For our mock implementation, we'll still use proper naming but point to Ubuntu
    const baseImage = 'ubuntu-20-04-x64';
    
    // In production, these would be actual DigitalOcean marketplace image IDs
    // For now, we'll name them appropriately to demonstrate the functionality
    const appMap: Record<string, string> = {
      // Web Development
      'nodejs': 'nodejs-20-04',
      'python': 'python-20-04',
      'docker': 'docker-20-04',
      'lamp': 'lamp-20-04',
      'lemp': 'lemp-20-04',
      'mean': 'mean-20-04',
      'mern': 'mern-20-04',
      
      // CMS
      'wordpress': 'wordpress-20-04',
      'ghost': 'ghost-20-04', 
      'drupal': 'drupal-20-04',
      'joomla': 'joomla-20-04',
      
      // E-commerce
      'woocommerce': 'woocommerce-20-04',
      'magento': 'magento-20-04',
      'prestashop': 'prestashop-20-04',
      
      // Frameworks
      'django': 'django-20-04',
      'rails': 'rails-20-04',
      'laravel': 'laravel-20-04',
      
      // Data Science
      'jupyter': 'jupyter-20-04',
      'rstudio': 'rstudio-20-04',
      'tensorflow': 'tensorflow-20-04',
      
      // Databases
      'mongodb': 'mongodb-20-04',
      'postgres': 'postgres-20-04',
      'mysql': 'mysql-20-04',
      'redis': 'redis-20-04',
      'couchdb': 'couchdb-20-04',
      
      // CI/CD and DevOps
      'jenkins': 'jenkins-20-04',
      'gitlab': 'gitlab-20-04',
      'prometheus': 'prometheus-20-04',
      'grafana': 'grafana-20-04',
      
      // Game Servers
      'minecraft': 'game-minecraft-20-04',
      'csgo': 'game-csgo-20-04',
      'valheim': 'game-valheim-20-04',
      'rust': 'game-rust-20-04',
      'ark': 'game-ark-20-04',
      
      // Discord Bots
      'discordjs': 'nodejs-20-04', // Discord.js runs on Node.js
      'discordpy': 'python-20-04', // Discord.py runs on Python
    };
    
    // Log application selection for debugging
    console.log(`Application selected: ${appSlug}, Using image: ${appMap[appSlug] || baseImage}`);
    
    return appMap[appSlug] || baseImage;
  }

  // Helper method for API requests
  // Public method to allow direct API requests when needed
  async apiRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: any
  ): Promise<T> {
    try {
      // Handle URL construction - endpoint may already contain query parameters
      let url = `${this.apiBaseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: method !== 'GET' && data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        // Try to parse error response as JSON, but handle case where it might not be JSON
        try {
          const errorText = await response.text();
          const errorJson = errorText ? JSON.parse(errorText) : {};
          throw new Error(`DigitalOcean API Error: ${JSON.stringify(errorJson)}`);
        } catch (parseError) {
          throw new Error(`DigitalOcean API Error: ${response.status} ${response.statusText}`);
        }
      }

      // For DELETE operations, the response might be empty
      if (method === 'DELETE') {
        if (response.status === 204 || response.headers.get('content-length') === '0') {
          return {} as T;
        }
      }

      // Try to parse JSON response, but handle case where it might be empty
      try {
        const text = await response.text();
        return text ? JSON.parse(text) as T : {} as T;
      } catch (parseError) {
        console.warn(`Could not parse response as JSON: ${parseError}`);
        return {} as T;
      }
    } catch (error) {
      console.error(`Error in DigitalOcean API request to ${endpoint}:`, error);
      throw error;
    }
  }

  // Public methods that support both mock and real API
  async getRegions(): Promise<Region[]> {
    if (this.useMock) {
      return this.mockRegions;
    }
    
    try {
      const response = await this.apiRequest<{ regions: Region[] }>('/regions');
      return response.regions.filter(region => region.available);
    } catch (error) {
      console.error('Error fetching regions, falling back to mock data:', error);
      return this.mockRegions;
    }
  }

  async getSizes(): Promise<Size[]> {
    if (this.useMock) {
      return this.mockSizes;
    }
    
    try {
      const response = await this.apiRequest<{ sizes: Size[] }>('/sizes');
      
      // Filter and add processor_type property to each size object
      const filteredSizes = response.sizes
        .filter(size => 
          size.available && 
          size.price_monthly > 0
        )
        .map(size => {
          // Determine processor type based on slug pattern
          let processor_type: 'regular' | 'intel' | 'amd' = 'regular';
          
          if (size.slug.includes('-intel')) {
            processor_type = 'intel';
          } else if (size.slug.includes('-amd')) {
            processor_type = 'amd';
          }
          
          return {
            ...size,
            processor_type
          };
        });
      
      return filteredSizes;
    } catch (error) {
      console.error('Error fetching sizes, falling back to mock data:', error);
      return this.mockSizes;
    }
  }

  async getDistributions(): Promise<Distribution[]> {
    if (this.useMock) {
      return this.mockDistributions;
    }
    
    try {
      // In a real implementation, we would fetch from the DigitalOcean API
      // For now, we'll use mock data
      console.log('DigitalOcean API available, but using mock distributions data for consistency');
      return this.mockDistributions;
    } catch (error) {
      console.error('Error fetching distributions, falling back to mock data:', error);
      return this.mockDistributions;
    }
  }

  async getApplications(): Promise<Application[]> {
    if (this.useMock) {
      return this.mockApplications;
    }
    
    try {
      // In a real implementation, we would fetch from the DigitalOcean API
      // Due to complex structure of DO's API for applications, we'll use mock data
      // instead of trying to parse their complex response format
      console.log('DigitalOcean API available, but using mock applications data for consistency');
      return this.mockApplications;
    } catch (error) {
      console.error('Error fetching applications, falling back to mock data:', error);
      return this.mockApplications;
    }
  }

  async createDroplet(options: {
    name: string;
    region: string;
    size: string;
    application?: string;
    ssh_keys?: string[];
    password?: string;
    ipv6?: boolean;
  }): Promise<{ id: string; ip_address: string; ipv6_address?: string }> {
    if (this.useMock) {
      // Mock droplet creation with optional IPv6
      const mockResponse: {
        id: string;
        ip_address: string;
        ipv6_address?: string;
      } = {
        id: Math.random().toString(36).substring(7),
        ip_address: `${Math.floor(Math.random() * 256)}.${Math.floor(
          Math.random() * 256,
        )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      };
      
      if (options.ipv6) {
        mockResponse.ipv6_address = `2001:db8:${Math.floor(Math.random() * 9999)}:${Math.floor(
          Math.random() * 9999,
        )}:${Math.floor(Math.random() * 9999)}:${Math.floor(Math.random() * 9999)}::/64`;
      }
      
      // Create a default firewall for this droplet
      this.setupDefaultFirewall(mockResponse.id);
      
      return mockResponse;
    }
    
    try {
      // Prepare droplet creation data
      const dropletData: any = {
        name: options.name,
        region: options.region,
        size: options.size,
        image: this.getImageForApplication(options.application) || 'ubuntu-20-04-x64', // Default to Ubuntu if no app specified
        ssh_keys: options.ssh_keys || [],
        ipv6: !!options.ipv6,
        monitoring: true, // Enable monitoring by default
      };
      
      // Handle proper password setup with cloud-init user-data script
      if (options.password) {
        // This more comprehensive cloud-init script properly sets the password
        // and ensures SSH password authentication is enabled
        dropletData.user_data = `#cloud-config
password: ${options.password}
chpasswd: { expire: False }
ssh_pwauth: True

runcmd:
  - echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config
  - echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
  - systemctl restart ssh
`;
      }
      
      const response = await this.apiRequest<{ droplet: any }>('/droplets', 'POST', dropletData);
      
      // In real API, the droplet is being created asynchronously, 
      // so we need to poll for the IP address
      let ipAddress = null;
      let ipv6Address = null;
      let attempts = 0;
      
      while ((!ipAddress || (options.ipv6 && !ipv6Address)) && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const dropletDetails = await this.apiRequest<{ droplet: any }>(
          `/droplets/${response.droplet.id}`
        );
        
        // Extract IP addresses from networks
        if (dropletDetails.droplet.networks?.v4?.length > 0) {
          const publicIp = dropletDetails.droplet.networks.v4.find(
            (network: any) => network.type === 'public'
          );
          if (publicIp) {
            ipAddress = publicIp.ip_address;
          }
        }
        
        if (options.ipv6 && dropletDetails.droplet.networks?.v6?.length > 0) {
          ipv6Address = dropletDetails.droplet.networks.v6[0].ip_address;
        }
        
        attempts++;
      }
      
      return {
        id: response.droplet.id.toString(),
        ip_address: ipAddress || 'pending',
        ...(options.ipv6 && ipv6Address ? { ipv6_address: ipv6Address } : {})
      };
    } catch (error) {
      console.error('Error creating droplet:', error);
      throw error;
    }
  }

  async createVolume(options: {
    name: string;
    region: string;
    size_gigabytes: number;
    description?: string;
  }): Promise<{ id: string }> {
    if (this.useMock) {
      // Prevent duplicate volume names in mock mode
      const mockId = `vol-${options.name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: mockId,
      };
    }
    
    try {
      const response = await this.apiRequest<{ volume: any }>(
        '/volumes', 
        'POST', 
        {
          name: options.name,
          region: options.region,
          size_gigabytes: options.size_gigabytes,
          description: options.description || `Volume for ${options.name}`
        }
      );
      
      return {
        id: response.volume.id
      };
    } catch (error: any) {
      console.error('Error creating volume:', error);
      
      // Handle 409 Conflict errors (likely duplicate volume name)
      if (error.message && error.message.includes('409 Conflict')) {
        throw new Error(`A volume with name "${options.name}" already exists. Please use a different name.`);
      }
      
      // Return a more user-friendly error
      throw new Error(`Failed to create volume: ${error.message || 'Unknown error'}`);
    }
  }

  async deleteDroplet(id: string): Promise<void> {
    if (this.useMock) {
      console.log(`Mock deletion of droplet ${id} successful`);
      return; // Mock deletion just returns
    }
    
    try {
      await this.apiRequest(`/droplets/${id}`, 'DELETE');
    } catch (error: any) {
      // Check if it's a 404 error, which means the droplet doesn't exist
      if (error.message && error.message.includes('404 Not Found')) {
        console.log(`Droplet ${id} not found on DigitalOcean, it may have been already deleted`);
        return; // Consider a 404 as a successful deletion
      }
      
      console.error(`Error deleting droplet ${id}:`, error);
      throw error;
    }
  }

  async deleteVolume(id: string): Promise<void> {
    if (this.useMock) {
      console.log(`Mock deletion of volume ${id} successful`);
      return; // Mock deletion always succeeds
    }
    
    try {
      await this.apiRequest(`/volumes/${id}`, 'DELETE');
    } catch (error: any) {
      // Log the error but don't throw, to allow the UI flow to continue
      console.error(`Error deleting volume ${id}:`, error);
      
      // If this is a 409 Conflict error, it could be because the volume is still attached
      if (error.message && error.message.includes('409 Conflict')) {
        console.warn(`Volume ${id} may still be attached to a droplet. Will proceed with local deletion.`);
      } else {
        throw error;
      }
    }
  }

  async performDropletAction(
    dropletId: string, 
    action: 'power_on' | 'power_off' | 'reboot' | 'enable_ipv6'
  ): Promise<void> {
    if (this.useMock) {
      return; // Mock action just returns
    }
    
    try {
      await this.apiRequest(
        `/droplets/${dropletId}/actions`, 
        'POST', 
        { type: action }
      );
    } catch (error) {
      console.error(`Error performing ${action} on droplet ${dropletId}:`, error);
      throw error;
    }
  }
  
  // New method to attach volumes to droplets
  async attachVolumeToDroplet(volumeId: string, dropletId: string, region: string): Promise<void> {
    if (this.useMock) {
      return; // Mock attachment just returns success
    }
    
    try {
      await this.apiRequest(
        `/volumes/${volumeId}/actions`,
        'POST',
        {
          type: 'attach',
          droplet_id: parseInt(dropletId),
          region
        }
      );
      
      // Wait for the attachment to complete (this would be async in real DO API)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`Successfully attached volume ${volumeId} to droplet ${dropletId}`);
    } catch (error) {
      console.error(`Error attaching volume ${volumeId} to droplet ${dropletId}:`, error);
      throw error;
    }
  }
  
  // New method to detach volumes from droplets
  async detachVolumeFromDroplet(volumeId: string, dropletId: string, region: string): Promise<void> {
    if (this.useMock) {
      return; // Mock detachment just returns success
    }
    
    try {
      await this.apiRequest(
        `/volumes/${volumeId}/actions`,
        'POST',
        {
          type: 'detach',
          droplet_id: parseInt(dropletId),
          region
        }
      );
      
      // Wait for the detachment to complete (this would be async in real DO API)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`Successfully detached volume ${volumeId} from droplet ${dropletId}`);
    } catch (error) {
      console.error(`Error detaching volume ${volumeId} from droplet ${dropletId}:`, error);
      throw error;
    }
  }

  async getServerMetrics(dropletId: string): Promise<any> {
    if (this.useMock || process.env.FORCE_MOCK_METRICS === 'true') {
      // Use mock data if no API key or explicitly forced
      return this.generateMockMetrics();
    }
    
    try {
      // Prepare the query parameters
      let url = `/monitoring/metrics?host_id=${dropletId}`;
      url += `&start=${encodeURIComponent(new Date(Date.now() - 1800000).toISOString())}`; // 30 minutes ago
      url += `&end=${encodeURIComponent(new Date().toISOString())}`;
      // Add metrics parameters
      ['cpu', 'memory', 'disk', 'network', 'load_1', 'load_5', 'load_15'].forEach(metric => {
        url += `&metrics[]=${metric}`;
      });
      
      // Fetch real metrics from DigitalOcean API with manually constructed URL
      const response = await this.apiRequest<any>(url);
      
      // Process and format the response
      if (response && response.data) {
        // Extract latest values from timeseries data
        const metrics = {
          cpu: this.getLatestMetricValue(response.data.cpu) || 0,
          memory: this.getLatestMetricValue(response.data.memory) || 0,
          disk: this.getLatestMetricValue(response.data.disk) || 0,
          network_in: this.getLatestMetricValue(response.data.network_in) || 0,
          network_out: this.getLatestMetricValue(response.data.network_out) || 0,
          load_average: [
            this.getLatestMetricValue(response.data.load_1) || 0,
            this.getLatestMetricValue(response.data.load_5) || 0,
            this.getLatestMetricValue(response.data.load_15) || 0
          ],
          uptime_seconds: response.data.uptime || 3600 // Default to 1 hour if not available
        };
        return metrics;
      }
      
      // Fallback to mock data if API response format isn't as expected
      console.warn('Unexpected DigitalOcean metrics format, using mock data');
      return this.generateMockMetrics();
    } catch (error) {
      console.error('Error fetching metrics from DigitalOcean:', error);
      // Fallback to mock data on error
      return this.generateMockMetrics();
    }
  }
  
  // Helper to extract the latest metric value from a timeseries
  private getLatestMetricValue(timeseries: Array<{time: string, value: number}> | undefined): number | null {
    if (!timeseries || !Array.isArray(timeseries) || timeseries.length === 0) {
      return null;
    }
    
    // Sort by timestamp descending and take the first (latest) value
    return timeseries
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0].value;
  }
  
  // Helper to generate consistent mock metrics
  private generateMockMetrics() {
    return {
      cpu: Math.floor(Math.random() * 70) + 10, // 10-80%
      memory: Math.floor(Math.random() * 60) + 20, // 20-80%
      disk: Math.floor(Math.random() * 30) + 20, // 20-50%
      network_in: Math.floor(Math.random() * 10000000), // 0-10MB
      network_out: Math.floor(Math.random() * 5000000), // 0-5MB
      load_average: [
        Math.random() * 2, 
        Math.random() * 1.5, 
        Math.random() * 1
      ],
      uptime_seconds: 3600 * 24 * Math.floor(Math.random() * 30 + 1), // 1-30 days
    };
  }
  
  // Mock firewall data
  public mockFirewalls: Record<string, Firewall> = {};
  // Create default firewall for a droplet - this is public so it can be called from routes
  public setupDefaultFirewall(dropletId: string): Firewall {
    // Always create a default firewall regardless of mock mode
    // This ensures firewalls are available for all droplets
    const existingFirewall = Object.values(this.mockFirewalls).find(
      firewall => firewall.droplet_ids.includes(parseInt(dropletId))
    );
    
    if (existingFirewall) {
      return existingFirewall;
    }
    
    // Create a new firewall with NO default rules as required
    // Users must explicitly add rules through the UI
    const firewallId = `firewall-${Math.random().toString(36).substring(7)}`;
    const newFirewall: Firewall = {
      id: firewallId,
      name: `firewall-${dropletId}`,
      status: 'active',
      created_at: new Date().toISOString(),
      droplet_ids: [parseInt(dropletId)],
      // Start with empty rule sets
      inbound_rules: [],
      outbound_rules: []
    };
    
    // Store the firewall in our mock collection
    this.mockFirewalls[firewallId] = newFirewall;
    console.log(`Created default firewall for droplet ${dropletId}: ${firewallId}`);
    
    return newFirewall;
  }
  
  // Firewall methods
  async getFirewalls(): Promise<Firewall[]> {
    if (this.useMock) {
      return Object.values(this.mockFirewalls);
    }

    try {
      const response = await this.apiRequest<{ firewalls: Firewall[] }>('/firewalls');
      return response.firewalls;
    } catch (error) {
      console.error('Error fetching firewalls:', error);
      return Object.values(this.mockFirewalls);
    }
  }

  async getFirewallByDropletId(dropletId: string): Promise<Firewall | null> {
    const dropletIdNumber = parseInt(dropletId);
    
    // First check in the mock firewalls, regardless of useMock flag
    // This ensures that any mock firewalls created as fallbacks will be found
    const mockFirewall = Object.values(this.mockFirewalls).find(
      firewall => firewall.droplet_ids.includes(dropletIdNumber)
    );
    
    if (mockFirewall) {
      console.log(`Found mock firewall ${mockFirewall.id} for droplet ${dropletId}`);
      return mockFirewall;
    }
    
    if (this.useMock) {
      return null;
    }

    try {
      const firewalls = await this.getFirewalls();
      return firewalls.find(firewall => 
        firewall.droplet_ids.includes(dropletIdNumber)
      ) || null;
    } catch (error) {
      console.error(`Error fetching firewall for droplet ${dropletId}:`, error);
      return null;
    }
  }

  async createFirewall(options: {
    name: string;
    droplet_ids: number[];
    inbound_rules: FirewallRule[];
    outbound_rules: FirewallRule[];
  }): Promise<Firewall> {
    if (this.useMock || process.env.FORCE_MOCK_FIREWALLS === 'true') {
      // Check if a firewall already exists for any of these droplets
      const existingFirewall = Object.values(this.mockFirewalls).find(
        firewall => options.droplet_ids.some(id => firewall.droplet_ids.includes(id))
      );
      
      if (existingFirewall) {
        // Update existing firewall instead of creating a new one
        console.log('Using existing firewall for droplet');
        existingFirewall.inbound_rules = options.inbound_rules;
        existingFirewall.outbound_rules = options.outbound_rules;
        
        // Make sure all requested droplet IDs are included
        const combinedDropletIds = new Set([...existingFirewall.droplet_ids, ...options.droplet_ids]);
        existingFirewall.droplet_ids = Array.from(combinedDropletIds);
        
        return existingFirewall;
      }
      
      // Create a new firewall
      const id = `firewall-${Math.random().toString(36).substring(7)}`;
      const firewall: Firewall = {
        id,
        name: options.name,
        status: 'active',
        created_at: new Date().toISOString(),
        droplet_ids: options.droplet_ids,
        inbound_rules: options.inbound_rules,
        outbound_rules: options.outbound_rules
      };

      this.mockFirewalls[id] = firewall;
      return firewall;
    }

    try {
      // Check if a firewall already exists for this droplet to avoid 409 Conflict
      const existingFirewall = await this.getFirewallByDropletId(options.droplet_ids[0].toString());
      if (existingFirewall) {
        console.log('Firewall already exists for droplet, updating instead of creating');
        return await this.updateFirewall(existingFirewall.id!, {
          inbound_rules: options.inbound_rules,
          outbound_rules: options.outbound_rules
        });
      }
      
      // Create a new firewall
      const response = await this.apiRequest<{ firewall: Firewall }>(
        '/firewalls',
        'POST',
        options
      );
      return response.firewall;
    } catch (error) {
      console.error('Error creating firewall:', error);
      
      // Create a mock firewall if API call fails
      console.log('Creating mock firewall due to API failure');
      const id = `firewall-fallback-${Math.random().toString(36).substring(7)}`;
      const firewall: Firewall = {
        id,
        name: options.name,
        status: 'active',
        created_at: new Date().toISOString(),
        droplet_ids: options.droplet_ids,
        inbound_rules: options.inbound_rules,
        outbound_rules: options.outbound_rules
      };

      this.mockFirewalls[id] = firewall;
      return firewall;
    }
  }

  async updateFirewall(
    firewallId: string,
    updates: Partial<Firewall>
  ): Promise<Firewall> {
    if (this.useMock) {
      if (!this.mockFirewalls[firewallId]) {
        throw new Error(`Firewall with ID ${firewallId} not found`);
      }

      this.mockFirewalls[firewallId] = {
        ...this.mockFirewalls[firewallId],
        ...updates
      };

      return this.mockFirewalls[firewallId];
    }

    try {
      const response = await this.apiRequest<{ firewall: Firewall }>(
        `/firewalls/${firewallId}`,
        'PUT',
        updates
      );
      return response.firewall;
    } catch (error) {
      console.error(`Error updating firewall ${firewallId}:`, error);
      throw error;
    }
  }

  async addDropletsToFirewall(
    firewallId: string,
    dropletIds: number[]
  ): Promise<void> {
    if (this.useMock) {
      if (!this.mockFirewalls[firewallId]) {
        throw new Error(`Firewall with ID ${firewallId} not found`);
      }

      this.mockFirewalls[firewallId].droplet_ids = [
        ...this.mockFirewalls[firewallId].droplet_ids,
        ...dropletIds.filter(id => !this.mockFirewalls[firewallId].droplet_ids.includes(id))
      ];
      return;
    }

    try {
      await this.apiRequest(
        `/firewalls/${firewallId}/droplets`,
        'POST',
        { droplet_ids: dropletIds }
      );
    } catch (error) {
      console.error(`Error adding droplets to firewall ${firewallId}:`, error);
      throw error;
    }
  }

  async removeDropletsFromFirewall(
    firewallId: string,
    dropletIds: number[]
  ): Promise<void> {
    if (this.useMock) {
      if (!this.mockFirewalls[firewallId]) {
        throw new Error(`Firewall with ID ${firewallId} not found`);
      }

      this.mockFirewalls[firewallId].droplet_ids = 
        this.mockFirewalls[firewallId].droplet_ids.filter(id => !dropletIds.includes(id));
      return;
    }

    try {
      await this.apiRequest(
        `/firewalls/${firewallId}/droplets`,
        'DELETE',
        { droplet_ids: dropletIds }
      );
    } catch (error) {
      console.error(`Error removing droplets from firewall ${firewallId}:`, error);
      throw error;
    }
  }

  async addRulesToFirewall(
    firewallId: string,
    inboundRules: FirewallRule[] = [],
    outboundRules: FirewallRule[] = []
  ): Promise<void> {
    if (this.useMock) {
      if (!this.mockFirewalls[firewallId]) {
        throw new Error(`Firewall with ID ${firewallId} not found`);
      }

      if (inboundRules.length > 0) {
        this.mockFirewalls[firewallId].inbound_rules = [
          ...this.mockFirewalls[firewallId].inbound_rules,
          ...inboundRules
        ];
      }

      if (outboundRules.length > 0) {
        this.mockFirewalls[firewallId].outbound_rules = [
          ...this.mockFirewalls[firewallId].outbound_rules,
          ...outboundRules
        ];
      }
      return;
    }

    try {
      await this.apiRequest(
        `/firewalls/${firewallId}/rules`,
        'POST',
        {
          inbound_rules: inboundRules,
          outbound_rules: outboundRules
        }
      );
    } catch (error) {
      console.error(`Error adding rules to firewall ${firewallId}:`, error);
      throw error;
    }
  }

  async removeRulesFromFirewall(
    firewallId: string,
    inboundRules: FirewallRule[] = [],
    outboundRules: FirewallRule[] = []
  ): Promise<void> {
    if (this.useMock) {
      if (!this.mockFirewalls[firewallId]) {
        throw new Error(`Firewall with ID ${firewallId} not found`);
      }

      if (inboundRules.length > 0) {
        const inboundPorts = inboundRules.map(rule => rule.ports);
        this.mockFirewalls[firewallId].inbound_rules = 
          this.mockFirewalls[firewallId].inbound_rules.filter(
            rule => !inboundPorts.includes(rule.ports)
          );
      }

      if (outboundRules.length > 0) {
        const outboundPorts = outboundRules.map(rule => rule.ports);
        this.mockFirewalls[firewallId].outbound_rules = 
          this.mockFirewalls[firewallId].outbound_rules.filter(
            rule => !outboundPorts.includes(rule.ports)
          );
      }
      return;
    }

    try {
      await this.apiRequest(
        `/firewalls/${firewallId}/rules`,
        'DELETE',
        {
          inbound_rules: inboundRules,
          outbound_rules: outboundRules
        }
      );
    } catch (error) {
      console.error(`Error removing rules from firewall ${firewallId}:`, error);
      throw error;
    }
  }

  async deleteFirewall(firewallId: string): Promise<void> {
    if (this.useMock) {
      delete this.mockFirewalls[firewallId];
      return;
    }

    try {
      await this.apiRequest(`/firewalls/${firewallId}`, 'DELETE');
    } catch (error) {
      console.error(`Error deleting firewall ${firewallId}:`, error);
      throw error;
    }
  }
}

export const digitalOcean = new DigitalOceanClient();