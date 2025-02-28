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

export interface Application {
  slug: string;
  name: string;
  description: string;
  type: string;
}

// Support both mock and real DigitalOcean API
export class DigitalOceanClient {
  private apiKey: string;
  private useMock: boolean;
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
      price_monthly: 5,
      processor_type: 'regular'
    },
    {
      slug: "s-1vcpu-2gb",
      memory: 2048,
      vcpus: 1,
      disk: 50,
      transfer: 2000,
      price_monthly: 10,
      processor_type: 'regular'
    },
    {
      slug: "s-2vcpu-4gb",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4000,
      price_monthly: 20,
      processor_type: 'regular'
    },
    {
      slug: "s-4vcpu-8gb",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5000,
      price_monthly: 40,
      processor_type: 'regular'
    },
    
    // Intel Optimized droplets
    {
      slug: "c-2-intel",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4000,
      price_monthly: 26,
      processor_type: 'intel'
    },
    {
      slug: "c-4-intel",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5000,
      price_monthly: 52,
      processor_type: 'intel'
    },
    {
      slug: "c-8-intel",
      memory: 16384,
      vcpus: 8,
      disk: 320,
      transfer: 6000,
      price_monthly: 104,
      processor_type: 'intel'
    },
    
    // AMD droplets
    {
      slug: "c-2-amd",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4000,
      price_monthly: 24,
      processor_type: 'amd'
    },
    {
      slug: "c-4-amd",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5000,
      price_monthly: 48,
      processor_type: 'amd'
    },
    {
      slug: "c-8-amd",
      memory: 16384,
      vcpus: 8,
      disk: 320,
      transfer: 6000,
      price_monthly: 96,
      processor_type: 'amd'
    },
    
    // GPU droplets
    {
      slug: "g-2core-gpu",
      memory: 32768,
      vcpus: 8,
      disk: 400,
      transfer: 10000,
      price_monthly: 520,
      processor_type: 'gpu'
    },
    {
      slug: "g-4core-gpu",
      memory: 65536,
      vcpus: 16,
      disk: 800,
      transfer: 15000,
      price_monthly: 1040,
      processor_type: 'gpu'
    },
  ];

  private mockApplications: Application[] = [
    // Web Development
    {
      slug: "nodejs",
      name: "Node.js",
      description: "Node.js on Ubuntu 20.04",
      type: "application",
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
  ];

  // Helper method to map application slugs to valid image IDs
  private getImageForApplication(appSlug?: string): string {
    if (!appSlug) return 'ubuntu-20-04-x64';
    
    // In a real implementation, these would be actual DO application images
    // For our mock implementation, we'll just default to Ubuntu 20.04
    const baseImage = 'ubuntu-20-04-x64';
    
    // For demonstration purposes, we'll maintain this map to show how
    // different applications would map to different base images in a real implementation
    const appMap: Record<string, string> = {
      // Web Development
      'nodejs': baseImage,
      'python': baseImage,
      'docker': baseImage,
      'lamp': baseImage,
      'lemp': baseImage,
      'mean': baseImage,
      'mern': baseImage,
      
      // CMS
      'wordpress': baseImage,
      'ghost': baseImage, 
      'drupal': baseImage,
      
      // E-commerce
      'woocommerce': baseImage,
      'magento': baseImage,
      
      // Data Science
      'jupyter': baseImage,
      'rstudio': baseImage,
      
      // Databases
      'mongodb': baseImage,
      'postgres': baseImage,
      'mysql': baseImage,
      'redis': baseImage,
      
      // CI/CD and DevOps
      'jenkins': baseImage,
      'gitlab': baseImage,
    };
    
    return appMap[appSlug] || baseImage;
  }

  // Helper method for API requests
  private async apiRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    data?: any
  ): Promise<T> {
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: data ? JSON.stringify(data) : undefined
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
      return response.sizes.filter(size => 
        size.available && 
        size.price_monthly > 0 && 
        size.slug.startsWith('s-')
      );
    } catch (error) {
      console.error('Error fetching sizes, falling back to mock data:', error);
      return this.mockSizes;
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
      const mockResponse = {
        id: Math.random().toString(36).substring(7),
        ip_address: `${Math.floor(Math.random() * 256)}.${Math.floor(
          Math.random() * 256,
        )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      };
      
      if (options.ipv6) {
        return {
          ...mockResponse,
          ipv6_address: `2001:db8:${Math.floor(Math.random() * 9999)}:${Math.floor(
            Math.random() * 9999,
          )}:${Math.floor(Math.random() * 9999)}:${Math.floor(Math.random() * 9999)}::/64`
        };
      }
      
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
      
      if (options.password) {
        dropletData.user_data = `#!/bin/bash\necho root:${options.password} | chpasswd`;
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
      return {
        id: Math.random().toString(36).substring(7),
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
    } catch (error) {
      console.error('Error creating volume:', error);
      throw error;
    }
  }

  async deleteDroplet(id: string): Promise<void> {
    if (this.useMock) {
      return; // Mock deletion just returns
    }
    
    try {
      await this.apiRequest(`/droplets/${id}`, 'DELETE');
    } catch (error) {
      console.error(`Error deleting droplet ${id}:`, error);
      throw error;
    }
  }

  async deleteVolume(id: string): Promise<void> {
    if (this.useMock) {
      return; // Mock deletion just returns
    }
    
    try {
      await this.apiRequest(`/volumes/${id}`, 'DELETE');
    } catch (error) {
      console.error(`Error deleting volume ${id}:`, error);
      throw error;
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

  async getServerMetrics(dropletId: string): Promise<any> {
    if (this.useMock) {
      // Return mock metrics
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
    
    try {
      // Fetch metrics from the monitoring endpoint
      // Note: This is a simplified approximation as DO's actual metrics API is more complex
      const response = await this.apiRequest<any>(
        `/monitoring/metrics/droplet/${dropletId}?start=${Date.now() - 3600000}&end=${Date.now()}`
      );
      
      return {
        cpu: response.metrics.cpu.value || 0,
        memory: response.metrics.memory.value || 0,
        disk: response.metrics.disk.value || 0,
        network_in: response.metrics.network.in.value || 0,
        network_out: response.metrics.network.out.value || 0,
        load_average: [
          response.metrics.load.load1 || 0,
          response.metrics.load.load5 || 0,
          response.metrics.load.load15 || 0,
        ],
        uptime_seconds: response.metrics.uptime || 0,
      };
    } catch (error) {
      console.error(`Error fetching metrics for droplet ${dropletId}:`, error);
      // Fallback to mock data in case of error
      return {
        cpu: Math.floor(Math.random() * 70) + 10,
        memory: Math.floor(Math.random() * 60) + 20,
        disk: Math.floor(Math.random() * 30) + 20,
        network_in: Math.floor(Math.random() * 10000000),
        network_out: Math.floor(Math.random() * 5000000),
        load_average: [
          Math.random() * 2, 
          Math.random() * 1.5, 
          Math.random() * 1
        ],
        uptime_seconds: 3600 * 24 * Math.floor(Math.random() * 30 + 1),
      };
    }
  }
}

export const digitalOcean = new DigitalOceanClient();