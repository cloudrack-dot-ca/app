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

// Mock DigitalOcean API client for development
export class DigitalOceanClient {
  private regions: Region[] = [
    {
      slug: "nyc1",
      name: "New York 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb"],
      available: true,
    },
    {
      slug: "sfo1",
      name: "San Francisco 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb"],
      available: true,
    },
    {
      slug: "ams3",
      name: "Amsterdam 3",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb"],
      available: true,
    },
    {
      slug: "tor1",
      name: "Toronto 1",
      sizes: ["s-1vcpu-1gb", "s-1vcpu-2gb", "s-2vcpu-4gb"],
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
  ];

  async getRegions(): Promise<Region[]> {
    return this.regions;
  }

  async getSizes(): Promise<Size[]> {
    return this.sizes;
  }

  async createDroplet(options: {
    name: string;
    region: string;
    size: string;
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
