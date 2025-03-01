import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Client as SSHClient, ClientChannel } from 'ssh2';
import { storage } from './storage';
import { log } from './vite';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { cloudRackKeyManager } from './cloudrack-key-manager';

// Extend the Server type to include rootPassword
interface ExtendedServer {
  id: number;
  userId: number;
  name: string;
  dropletId: string;
  region: string;
  size: string;
  status: string;
  ipAddress: string | null;
  ipv6Address: string | null;
  specs: { memory: number; vcpus: number; disk: number; } | null;
  application: string | null;
  lastMonitored: Date | null;
  // Add rootPassword property that may be present
  rootPassword?: string;
}

export function setupTerminalSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  io.on('connection', async (socket) => {
    const serverId = socket.handshake.query.serverId as string;
    const userId = socket.handshake.query.userId as string;
    
    if (!serverId || !userId) {
      socket.emit('error', 'Missing server ID or user ID');
      socket.disconnect();
      return;
    }
    
    log(`Terminal connection request for server ${serverId} from user ${userId}`, 'terminal');
    
    try {
      // Verify server ownership
      const server = await storage.getServer(parseInt(serverId)) as unknown as ExtendedServer;
      if (!server) {
        socket.emit('error', 'Server not found');
        socket.disconnect();
        return;
      }
      
      if (server.userId !== parseInt(userId)) {
        socket.emit('error', 'Unauthorized access to server');
        socket.disconnect();
        return;
      }
      
      // Connect to the server via SSH
      const sshClient = new SSHClient();
      let sshStream: ClientChannel | null = null;
      
      socket.emit('status', { status: 'connecting' });
      
      sshClient.on('ready', () => {
        socket.emit('status', { status: 'connected' });
        
        // Create a new shell session
        sshClient.shell((err: Error | undefined, stream: ClientChannel) => {
          if (err) {
            socket.emit('error', `Failed to create shell: ${err.message}`);
            socket.disconnect();
            return;
          }
          
          sshStream = stream;
          
          // Forward data from SSH to the client
          stream.on('data', (data: Buffer) => {
            socket.emit('data', data.toString('utf-8'));
          });
          
          stream.on('close', () => {
            socket.emit('status', { status: 'disconnected' });
            sshClient.end();
          });
          
          stream.stderr.on('data', (data: Buffer) => {
            socket.emit('data', data.toString('utf-8'));
          });
        });
      });
      
      sshClient.on('error', (err) => {
        log(`SSH connection error: ${err.message}`, 'terminal');
        socket.emit('error', `SSH connection error: ${err.message}`);
        socket.disconnect();
      });
      
      sshClient.on('close', () => {
        socket.emit('status', { status: 'disconnected' });
      });
      
      sshClient.on('end', () => {
        socket.emit('status', { status: 'disconnected' });
      });
      
      // Handle connection to the server
      const connectSSH = async () => {
        try {
          if (!server.ipAddress) {
            throw new Error('Server IP address is not available');
          }
          
          // Log connection attempt for debugging
          log(`Attempting SSH connection to ${server.ipAddress} for server ${server.id}`, 'terminal');
          
          // Verify that user has CloudRack key
          const hasKey = await cloudRackKeyManager.hasCloudRackKey(parseInt(userId));
          if (!hasKey) {
            throw new Error('CloudRack Terminal Key not found in your account. Please contact support.');
          }
          
          // Get the CloudRack SSH private key path
          const keyPath = cloudRackKeyManager.getCloudRackPrivateKeyPath();
          
          // Check if the CloudRack SSH private key exists
          if (!fs.existsSync(keyPath)) {
            throw new Error('CloudRack SSH key not found on server. Terminal functionality is disabled.');
          }
          
          // Read the CloudRack SSH private key
          const privateKey = fs.readFileSync(keyPath, 'utf8');
          
          // Check private key format
          if (!privateKey.includes('-----BEGIN') || !privateKey.includes('PRIVATE KEY-----')) {
            throw new Error('Invalid SSH private key format. Please regenerate CloudRack keys.');
          }
          
          // Log connection attempt with key format info (masked)
          log(`Connecting to ${server.ipAddress} with key in format: ${privateKey.includes('-----BEGIN RSA PRIVATE KEY-----') ? 'RSA PEM' : 'OTHER PEM'}`, 'terminal');
          
          // Use SSH key authentication with explicit PEM format
          sshClient.connect({
            host: server.ipAddress,
            port: 22,
            username: 'root',
            privateKey: privateKey, // Must be in PEM format
            readyTimeout: 20000, // Extended timeout
            keepaliveInterval: 10000,
            tryKeyboard: true, // Try keyboard-interactive auth as fallback
            debug: (message: string) => {
              // Always log SSH debug messages for troubleshooting terminal issues
              log(`SSH Debug: ${message}`, 'terminal');
            }
          });
        } catch (error: any) {
          log(`SSH connection error: ${error.message}`, 'terminal');
          socket.emit('error', `Failed to connect: ${error.message}`);
        }
      }
      
      // Handle data from the client to the SSH server
      socket.on('data', (data) => {
        if (sshStream) {
          sshStream.write(data);
        }
      });
      
      // Handle resize events
      socket.on('resize', (data: { rows: number, cols: number }) => {
        if (sshStream) {
          try {
            // Use proper SSH window size parameters
            sshStream.setWindow(data.rows, data.cols, data.cols * 8, data.rows * 10);
          } catch (err) {
            log(`Terminal resize error: ${err}`, 'terminal');
          }
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        if (sshClient) {
          sshClient.end();
        }
      });
      
      // Start connection process
      connectSSH().catch(err => {
        log(`Terminal connection failed: ${err.message}`, 'terminal');
        socket.emit('error', `Terminal connection failed: ${err.message}`);
        socket.disconnect();
      });
      
    } catch (error: any) {
      log(`Terminal error: ${error.message}`, 'terminal');
      socket.emit('error', `Terminal error: ${error.message}`);
      socket.disconnect();
    }
  });
  
  return io;
}