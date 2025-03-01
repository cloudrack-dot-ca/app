import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { storage } from './storage';
import { log } from './vite';
import { cloudRackKeyManager } from './cloudrack-key-manager';
import * as fs from 'fs';

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
  rootPassword?: string;
}

export function setupTerminalSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  // Use default namespace for simpler client connection
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
      
      if (!server.ipAddress) {
        socket.emit('error', 'Server IP address not available');
        socket.disconnect();
        return;
      }
      
      // Get server details with sensitive data to check for root password
      // Need to fetch details directly from API endpoint to get the actual password
      // storage.getServer() doesn't return the raw password for security
      const response = await fetch(`http://localhost:5000/api/servers/${serverId}/details`, {
        headers: {
          'Cookie': socket.handshake.headers.cookie || ''
        }
      });
      
      const serverDetails = await response.json();
      const hasRootPassword = !!serverDetails?.rootPassword;
      
      log(`Server ${serverId} root password status: ${hasRootPassword ? 'Available' : 'Not available'}`, 'terminal');
      
      // Create a new SSH client
      const sshClient = new Client();
      let sshStream: ClientChannel | null = null;
      
      // Notify client of connection attempt
      socket.emit('status', { 
        status: 'connecting',
        message: `Connecting to ${server.name} (${server.ipAddress})...`
      });
      
      // Set up SSH client event handlers
      sshClient.on('ready', () => {
        log(`SSH connection established for server ${server.id}`, 'terminal');
        socket.emit('status', { 
          status: 'connected',
          message: hasRootPassword ? 
            'Connected using password authentication' : 
            'Connected using CloudRack Terminal Key'
        });
        
        // Create a shell session
        sshClient.shell((err, stream) => {
          if (err) {
            log(`Failed to create shell: ${err.message}`, 'terminal');
            socket.emit('error', `Failed to create shell: ${err.message}`);
            socket.disconnect();
            return;
          }
          
          sshStream = stream;
          socket.emit('ready');
          
          // Forward data from SSH to the client
          stream.on('data', (data: Buffer) => {
            socket.emit('data', data.toString('utf-8'));
          });
          
          stream.on('close', () => {
            log(`SSH stream closed for server ${server.id}`, 'terminal');
            socket.emit('status', { status: 'disconnected' });
            sshClient.end();
          });
          
          stream.stderr.on('data', (data: Buffer) => {
            socket.emit('data', data.toString('utf-8'));
          });
        });
      });
      
      sshClient.on('error', (err) => {
        log(`SSH error for server ${server.id}: ${err.message}`, 'terminal');
        
        // Create more user-friendly error messages
        let userMessage = `SSH error: ${err.message}`;
        
        if (err.message.includes('All configured authentication methods failed')) {
          userMessage = 'Authentication failed. Please check your password or SSH key settings.';
        } else if (err.message.includes('connect ETIMEDOUT')) {
          userMessage = 'Connection timed out. Server may be starting up or behind a firewall.';
        } else if (err.message.includes('connect ECONNREFUSED')) {
          userMessage = 'Connection refused. SSH service may not be running on the server.';
        }
        
        socket.emit('error', userMessage);
        socket.disconnect();
      });
      
      sshClient.on('end', () => {
        log(`SSH connection ended for server ${server.id}`, 'terminal');
        socket.emit('status', { status: 'disconnected' });
      });
      
      sshClient.on('close', () => {
        log(`SSH connection closed for server ${server.id}`, 'terminal');
        socket.emit('status', { status: 'disconnected' });
      });
      
      // Handle keyboard-interactive authentication
      sshClient.on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
        // If it's a password prompt and we have the root password, use it
        if (prompts.length > 0 && hasRootPassword) {
          log(`Responding to keyboard-interactive with stored password`, 'terminal');
          finish([(serverDetails as any).rootPassword]);
        } else {
          // Otherwise inform the user authentication failed
          log(`Keyboard-interactive auth failed - no password available`, 'terminal');
          socket.emit('error', 'Authentication failed - password required');
          sshClient.end();
        }
      });
      
      // Forward data from client to SSH
      socket.on('data', (data: string) => {
        if (sshStream) {
          sshStream.write(data);
        }
      });
      
      // Handle resize events
      socket.on('resize', (data: { rows: number, cols: number }) => {
        if (sshStream) {
          try {
            sshStream.setWindow(data.rows, data.cols, data.cols * 8, data.rows * 10);
          } catch (err) {
            log(`Terminal resize error: ${err}`, 'terminal');
          }
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        log(`Socket disconnected for server ${server.id}`, 'terminal');
        if (sshClient) {
          sshClient.end();
        }
      });
      
      // Connect to the SSH server - try password auth first, fallback to key auth
      try {
        const config: ConnectConfig = {
          host: server.ipAddress,
          port: 22,
          username: 'root',
          readyTimeout: 30000, // 30 seconds
          keepaliveInterval: 10000,
          tryKeyboard: true // Enable keyboard-interactive auth as fallback
        };
        
        // If we have a root password, use it
        if (hasRootPassword) {
          config.password = (serverDetails as any).rootPassword;
          log(`Connecting to SSH server at ${server.ipAddress} with password auth`, 'terminal');
          socket.emit('status', { 
            status: 'auth_in_progress',
            message: 'Attempting password authentication'
          });
        } else {
          // Otherwise try to use the CloudRack Terminal Key
          try {
            // Check if the user has the CloudRack key
            const hasTerminalKey = await cloudRackKeyManager.hasCloudRackKey(parseInt(userId));
            if (!hasTerminalKey) {
              log(`User ${userId} does not have the CloudRack Terminal Key`, 'terminal');
              socket.emit('error', 'CloudRack Terminal Key not found. Please set a root password for your server.');
              socket.disconnect();
              return;
            }
            
            // Get the CloudRack key path
            const keyPath = cloudRackKeyManager.getCloudRackPrivateKeyPath();
            if (!fs.existsSync(keyPath)) {
              log(`CloudRack Terminal Key file not found at ${keyPath}`, 'terminal');
              socket.emit('error', 'CloudRack Terminal Key file not found. Please contact support.');
              socket.disconnect();
              return;
            }
            
            // Use the CloudRack Terminal Key
            config.privateKey = fs.readFileSync(keyPath);
            log(`Connecting to SSH server at ${server.ipAddress} with CloudRack Terminal Key`, 'terminal');
            socket.emit('status', { 
              status: 'auth_in_progress',
              message: 'Attempting SSH key authentication'
            });
          } catch (keyError) {
            log(`Error with CloudRack Terminal Key: ${(keyError as Error).message}`, 'terminal');
            socket.emit('error', 'Error with CloudRack Terminal Key. Please set a root password for your server.');
            socket.disconnect();
            return;
          }
        }
        
        // Add debug for hostname verification to avoid common SSH errors
        config.hostVerifier = () => true;
        
        // Connect to the SSH server
        sshClient.connect(config);
      } catch (error) {
        log(`SSH connection failed: ${(error as Error).message}`, 'terminal');
        socket.emit('error', `Failed to connect: ${(error as Error).message}`);
        socket.disconnect();
      }
    } catch (error) {
      log(`Terminal setup error: ${(error as Error).message}`, 'terminal');
      socket.emit('error', `Terminal error: ${(error as Error).message}`);
      socket.disconnect();
    }
  });
  
  return io;
}