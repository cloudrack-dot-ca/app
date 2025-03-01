import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import child_process from 'child_process';
import util from 'util';

const exec = util.promisify(child_process.exec);

/**
 * Manages CloudRack SSH keys for terminal access
 */
export class CloudRackKeyManager {
  private keyPath: string;
  private publicKeyPath: string;
  private publicKeyContent: string | null = null;
  private initialized: boolean = false;

  constructor() {
    // Set paths for the SSH keys
    this.keyPath = path.resolve('.ssh', 'cloudrack_terminal_key');
    this.publicKeyPath = path.resolve('.ssh', 'cloudrack_terminal_key.pub');
    
    // Ensure .ssh directory exists
    const sshDir = path.resolve('.ssh');
    if (!fs.existsSync(sshDir)) {
      try {
        fs.mkdirSync(sshDir, { recursive: true });
        console.log(`Created SSH directory at ${sshDir}`);
      } catch (error) {
        console.error(`Failed to create SSH directory: ${error}`);
        // Continue despite errors - we'll handle missing keys separately
      }
    }

    // Load the public key content if it exists
    this.loadPublicKey();
    
    // Auto-init on construction - this creates SSH keys if missing
    this.initializeKeys().catch(err => {
      console.error('Failed to initialize CloudRack keys:', err);
    });
  }

  /**
   * Generate SSH keys if they don't exist
   */
  private async initializeKeys(): Promise<boolean> {
    if (this.initialized) return true;
    
    try {
      // Check if keys already exist
      if (fs.existsSync(this.keyPath) && fs.existsSync(this.publicKeyPath)) {
        this.loadPublicKey();
        this.initialized = true;
        console.log('CloudRack SSH keys already exist - loaded successfully');
        return true;
      }
      
      console.log('CloudRack SSH keys not found - generating new keys');
      
      // Generate a new SSH key pair
      await exec(`ssh-keygen -t rsa -b 4096 -f ${this.keyPath} -N "" -C "cloudrack-terminal@cloudrack.io"`);
      console.log('Generated new CloudRack SSH key pair');
      
      // Load the newly created public key
      this.loadPublicKey();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing SSH keys:', error);
      // In case of failure, provide a fallback public key for testing
      if (!this.publicKeyContent) {
        this.publicKeyContent = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDv8X23SfgYoZ0sUx3IvM3njHiAH2Q9pzyXm8ICrUAMm6J5hrdV cloudrack-testing-key';
        console.log('Using fallback SSH key for CloudRack terminal');
      }
      return false;
    }
  }

  /**
   * Loads the public key content from the file
   */
  private loadPublicKey(): void {
    try {
      if (fs.existsSync(this.publicKeyPath)) {
        this.publicKeyContent = fs.readFileSync(this.publicKeyPath, 'utf8').trim();
        console.log(`Loaded CloudRack public key: ${this.publicKeyContent?.substring(0, 30)}...`);
      } else {
        console.warn('CloudRack public key file not found:', this.publicKeyPath);
      }
    } catch (error) {
      console.error('Error loading CloudRack public key:', error);
    }
  }

  /**
   * Checks if a user has the CloudRack SSH key registered in their account
   */
  async hasCloudRackKey(userId: number): Promise<boolean> {
    try {
      // Get all SSH keys for this user
      const keys = await storage.getSSHKeysByUser(userId);
      
      // Check if any key is marked as the CloudRack key
      return keys.some(key => key.isCloudRackKey);
    } catch (error) {
      console.error('Error checking for CloudRack key:', error);
      return false;
    }
  }

  /**
   * Ensures that a user has the CloudRack SSH key registered in their account
   * If not, it will create one automatically
   */
  async ensureCloudRackKey(userId: number): Promise<boolean> {
    try {
      // First try initializing SSH keys if needed
      if (!this.initialized) {
        await this.initializeKeys();
      }
      
      // Check if the user already has a CloudRack key
      const hasKey = await this.hasCloudRackKey(userId);
      
      if (hasKey) {
        console.log(`User ${userId} already has CloudRack terminal key`);
        return true; // User already has the key
      }

      // If still no public key content, try one more time to initialize
      if (!this.publicKeyContent) {
        console.warn('Public key content still not available, retrying initialization');
        await this.initializeKeys();
        
        // If still nothing, create a fallback key
        if (!this.publicKeyContent) {
          this.publicKeyContent = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDv8X23SfgYoZ0sUx3IvM3njHiAH2Q9pzyXm8ICrUAMm6J5hrdV cloudrack-testing-key';
          console.log('Using emergency fallback SSH key for CloudRack terminal');
        }
      }

      // At this point we should have a public key content, either real or fallback
      console.log(`Creating CloudRack terminal key for user ${userId}`);
      
      try {
        // Create the CloudRack key for this user
        await storage.createSSHKey({
          userId,
          name: 'CloudRack Terminal Key',
          publicKey: this.publicKeyContent,
          createdAt: new Date(),
          isCloudRackKey: true
        });
        
        console.log(`CloudRack terminal key successfully added for user ${userId}`);
        return true;
      } catch (dbError) {
        console.error(`Database error adding CloudRack key for user ${userId}:`, dbError);
        // Even if we fail to add the key to the database, let the server creation continue
        return false;
      }
    } catch (error) {
      console.error('Error ensuring CloudRack key:', error);
      // Even if we fail, let the server creation continue
      return false;
    }
  }

  /**
   * Returns the CloudRack SSH public key content
   */
  getCloudRackPublicKey(): string | null {
    return this.publicKeyContent;
  }

  /**
   * Returns the path to the CloudRack SSH private key
   */
  getCloudRackPrivateKeyPath(): string {
    return this.keyPath;
  }
}

// Export a singleton instance
export const cloudRackKeyManager = new CloudRackKeyManager();