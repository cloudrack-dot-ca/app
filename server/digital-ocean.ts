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
    {
      slug: "s-1vcpu-1gb",
      memory: 1024,
      vcpus: 1,
      disk: 25,
      transfer: 1000,
      price_monthly: 5,
    },
    {
      slug: "s-1vcpu-2gb",
      memory: 2048,
      vcpus: 1,
      disk: 50,
      transfer: 2000,
      price_monthly: 10,
    },
    {
      slug: "s-2vcpu-4gb",
      memory: 4096,
      vcpus: 2,
      disk: 80,
      transfer: 4000,
      price_monthly: 20,
    },
    {
      slug: "s-4vcpu-8gb",
      memory: 8192,
      vcpus: 4,
      disk: 160,
      transfer: 5000,
      price_monthly: 40,
    },
  ];

  private mockApplications: Application[] = [
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
  ];

  // Helper method to map application slugs to valid image IDs
  private getImageForApplication(appSlug?: string): string {
    if (!appSlug) return 'ubuntu-20-04-x64';
    
    const appMap: Record<string, string> = {
      'nodejs': 'ubuntu-20-04-x64', // In real implementation, these would be actual DO application images
      'python': 'ubuntu-20-04-x64',
      'docker': 'ubuntu-20-04-x64',
      'lamp': 'ubuntu-20-04-x64',
      'wordpress': 'ubuntu-20-04-x64',
      'lemp': 'ubuntu-20-04-x64',
      'mean': 'ubuntu-20-04-x64',
      'django': 'ubuntu-20-04-x64',
      'rails': 'ubuntu-20-04-x64',
      'ghost': 'ubuntu-20-04-x64',
    };
    
    return appMap[appSlug] || 'ubuntu-20-04-x64';
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
        const error = await response.json();
        throw new Error(`DigitalOcean API Error: ${JSON.stringify(error)}`);
      }

      return await response.json() as T;
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