import * as fs from 'fs';
import * as path from 'path';
import { storage } from './storage';
import { log } from './vite';

// Path to CloudRack's SSH public key
const CLOUDRACK_SSH_KEY_PATH = path.join(process.cwd(), '.ssh', 'cloudrack_terminal_key.pub');

/**
 * Manages CloudRack SSH keys for terminal access
 */
export class CloudRackKeyManager {
  
  /**
   * Checks if a user has the CloudRack SSH key registered in their account
   */
  async hasCloudRackKey(userId: number): Promise<boolean> {
    try {
      const userKeys = await storage.getSSHKeysByUser(userId);
      return userKeys.some(key => key.isCloudRackKey);
    } catch (error) {
      log(`Error checking for CloudRack key: ${(error as Error).message}`, 'cloudrack');
      return false;
    }
  }

  /**
   * Ensures that a user has the CloudRack SSH key registered in their account
   * If not, it will create one automatically
   */
  async ensureCloudRackKey(userId: number): Promise<boolean> {
    try {
      // Check if user already has a CloudRack key
      if (await this.hasCloudRackKey(userId)) {
        return true;
      }

      // Check if CloudRack SSH public key exists
      if (!fs.existsSync(CLOUDRACK_SSH_KEY_PATH)) {
        log('CloudRack SSH public key not found.', 'cloudrack');
        return false;
      }

      // Read CloudRack SSH public key
      const publicKey = fs.readFileSync(CLOUDRACK_SSH_KEY_PATH, 'utf8');

      // Create CloudRack SSH key for the user
      await storage.createSSHKey({
        userId,
        name: 'CloudRack Terminal Key',
        publicKey,
        isCloudRackKey: true,
        createdAt: new Date(),
      });

      log(`CloudRack SSH key created for user ${userId}`, 'cloudrack');
      return true;
    } catch (error) {
      log(`Error ensuring CloudRack key: ${(error as Error).message}`, 'cloudrack');
      return false;
    }
  }

  /**
   * Returns the CloudRack SSH public key content
   */
  getCloudRackPublicKey(): string | null {
    try {
      if (!fs.existsSync(CLOUDRACK_SSH_KEY_PATH)) {
        return null;
      }
      return fs.readFileSync(CLOUDRACK_SSH_KEY_PATH, 'utf8');
    } catch (error) {
      log(`Error reading CloudRack public key: ${(error as Error).message}`, 'cloudrack');
      return null;
    }
  }
}

// Export a singleton instance
export const cloudRackKeyManager = new CloudRackKeyManager();