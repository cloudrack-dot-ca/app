import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { storage } from './storage';
import { log } from './vite';

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
  
  io.of('/terminal').on('connection', async (socket) => {
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
      
      if (!server.rootPassword) {
        socket.emit('error', 'Root password not set. Terminal access requires root password.');
        socket.disconnect();
        return;
      }
      
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
          message: 'SSH connection established. Creating shell...'
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
        socket.emit('error', `SSH error: ${err.message}`);
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
      
      // Connect to the SSH server
      try {
        const config: ConnectConfig = {
          host: server.ipAddress,
          port: 22,
          username: 'root',
          password: server.rootPassword,
          readyTimeout: 30000, // 30 seconds
          keepaliveInterval: 10000
        };
        
        log(`Connecting to SSH server at ${server.ipAddress} with password auth`, 'terminal');
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