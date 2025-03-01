import { storage } from './storage';
import { cloudRackKeyManager } from './cloudrack-key-manager';

/**
 * Manages the system SSH key for terminal access
 * This key is used to provide access to newly created VPS instances
 */
export class SystemKeyManager {
  private readonly systemKeyFingerprint: string = 'c0:62:80:ae:2a:05:66:22:cb:d1:64:6e:54:c2:2c:ca';
  private readonly systemKeyName: string = 'CloudRack System Key';
  private readonly systemPublicKey: string = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDv8X23SfgYoZ0sUx3IvM3njHiAH2Q9pzyXm8ICrUAMm6J5hrdV cloudrack-system-key';
  
  /**
   * Checks if a user has the system SSH key registered in their account
   */
  async hasSystemKey(userId: number): Promise<boolean> {
    try {
      // Get all SSH keys for this user
      const keys = await storage.getSSHKeysByUser(userId);
      
      // Check if any key is marked as the system key
      return keys.some(key => key.name === this.systemKeyName);
    } catch (error) {
      console.error('Error checking for system key:', error);
      return false;
    }
  }
  
  /**
   * Ensures the system SSH key is added to the user's account
   * If not, it will create one automatically
   */
  async ensureSystemKey(userId: number): Promise<string | null> {
    try {
      // Check if the user already has the system key
      const hasKey = await this.hasSystemKey(userId);
      
      if (hasKey) {
        console.log(`User ${userId} already has system key`);
        const keys = await storage.getSSHKeysByUser(userId);
        const systemKey = keys.find(key => key.name === this.systemKeyName);
        return systemKey ? systemKey.id.toString() : null;
      }
      
      console.log(`Creating system key for user ${userId}`);
      
      try {
        // Create the system key for this user
        const newKey = await storage.createSSHKey({
          userId,
          name: this.systemKeyName,
          publicKey: this.systemPublicKey,
          createdAt: new Date(),
          isCloudRackKey: false, // This is not the terminal key
          isSystemKey: true // Mark as system key
        });
        
        console.log(`System key successfully added for user ${userId} with ID ${newKey.id}`);
        return newKey.id.toString();
      } catch (dbError) {
        console.error(`Database error adding system key for user ${userId}:`, dbError);
        return null;
      }
    } catch (error) {
      console.error('Error ensuring system key:', error);
      return null;
    }
  }
  
  /**
   * Returns the system SSH key fingerprint
   */
  getSystemKeyFingerprint(): string {
    return this.systemKeyFingerprint;
  }
  
  /**
   * Returns the system SSH public key
   */
  getSystemPublicKey(): string {
    return this.systemPublicKey;
  }
}

// Export a singleton instance
export const systemKeyManager = new SystemKeyManager();