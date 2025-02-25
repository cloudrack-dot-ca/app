import { Server, Volume } from "@shared/schema";

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
}

export interface Application {
  slug: string;
  name: string;
  description: string;
  type: string;
}

// Mock DigitalOcean API client for development
export class DigitalOceanClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.DIGITAL_OCEAN_API_KEY || '';
    if (!this.apiKey) {
      console.warn('DigitalOcean API key not found. Using mock data.');
    }
  }

  private regions: Region[] = [
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

  private sizes: Size[] = [
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

  private applications: Application[] = [
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

  async getRegions(): Promise<Region[]> {
    return this.regions;
  }

  async getSizes(): Promise<Size[]> {
    return this.sizes;
  }

  async getApplications(): Promise<Application[]> {
    return this.applications;
  }

  async createDroplet(options: {
    name: string;
    region: string;
    size: string;
    application?: string;
    ssh_keys?: string[];
    password?: string;
  }): Promise<{ id: string; ip_address: string }> {
    // Mock droplet creation
    return {
      id: Math.random().toString(36).substring(7),
      ip_address: `${Math.floor(Math.random() * 256)}.${Math.floor(
        Math.random() * 256,
      )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    };
  }

  async createVolume(options: {
    name: string;
    region: string;
    size_gigabytes: number;
  }): Promise<{ id: string }> {
    // Mock volume creation
    return {
      id: Math.random().toString(36).substring(7),
    };
  }

  async deleteDroplet(id: string): Promise<void> {
    // Mock droplet deletion
  }

  async deleteVolume(id: string): Promise<void> {
    // Mock volume deletion
  }
}

export const digitalOcean = new DigitalOceanClient();