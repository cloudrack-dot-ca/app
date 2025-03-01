import fs from 'fs';
import path from 'path';
import { storage } from './storage';

/**
 * Manages CloudRack SSH keys for terminal access
 */
export class CloudRackKeyManager {
  private keyPath: string;
  private publicKeyPath: string;
  private publicKeyContent: string | null = null;

  constructor() {
    // Set paths for the SSH keys
    this.keyPath = path.resolve('.ssh', 'cloudrack_terminal_key');
    this.publicKeyPath = path.resolve('.ssh', 'cloudrack_terminal_key.pub');
    
    // Ensure .ssh directory exists
    const sshDir = path.resolve('.ssh');
    if (!fs.existsSync(sshDir)) {
      fs.mkdirSync(sshDir, { recursive: true });
    }

    // Load the public key content if it exists
    this.loadPublicKey();
  }

  /**
   * Loads the public key content from the file
   */
  private loadPublicKey(): void {
    try {
      if (fs.existsSync(this.publicKeyPath)) {
        this.publicKeyContent = fs.readFileSync(this.publicKeyPath, 'utf8').trim();
      } else {
        console.error('CloudRack public key file not found:', this.publicKeyPath);
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
      // First check if the user already has a CloudRack key
      const hasKey = await this.hasCloudRackKey(userId);
      
      if (hasKey) {
        return true; // User already has the key
      }

      // If the public key content is not available, we can't proceed
      if (!this.publicKeyContent) {
        console.error('Cannot add CloudRack key: Public key content not available');
        return false;
      }

      // Create the CloudRack key for this user
      await storage.createSSHKey({
        userId,
        name: 'CloudRack Terminal Key',
        publicKey: this.publicKeyContent,
        createdAt: new Date(),
        isCloudRackKey: true
      });

      console.log(`CloudRack terminal key added for user ${userId}`);
      return true;
      
    } catch (error) {
      console.error('Error ensuring CloudRack key:', error);
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