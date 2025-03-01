import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { log } from './vite';

export function setupTerminalSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  log('Terminal handler in MAINTENANCE MODE - Database connections disabled', 'terminal');
  
  io.of('/terminal').on('connection', async (socket) => {
    const serverId = socket.handshake.query.serverId as string;
    const userId = socket.handshake.query.userId as string;
    
    log(`Terminal connection request received in maintenance mode - server ${serverId}, user ${userId}`, 'terminal');
    
    // Send maintenance notification to the client
    socket.emit('status', { 
      status: 'maintenance',
      message: 'Terminal access is temporarily unavailable for maintenance'
    });
    
    // Inform the client about the maintenance
    socket.emit('data', '\r\n\x1b[1;33m⚠️  Terminal service is currently under maintenance\x1b[0m\r\n\r\n');
    socket.emit('data', '\x1b[0;36mWe\'re improving the terminal experience and fixing some underlying issues.\x1b[0m\r\n');
    socket.emit('data', '\x1b[0;36mThe terminal feature will be back online soon.\x1b[0m\r\n\r\n');
    socket.emit('data', '\x1b[0;33mPlease check back later or contact support if you need immediate assistance.\x1b[0m\r\n');
    
    // Send error after a short delay to trigger the UI error handling
    setTimeout(() => {
      socket.emit('error', 'Terminal service is temporarily unavailable for maintenance');
      socket.disconnect();
    }, 5000);
  });
  
  return io;
}

/*
 * Original implementation is commented out below to avoid database connection issues
 * To be reinstated when database connection problems are resolved
 */

/*
import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { storage } from './storage';

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
*/