import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Maximize2, Minimize2, X, RefreshCw } from 'lucide-react';
import 'xterm/css/xterm.css';

export default function TerminalPage() {
  const { serverId } = useParams();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef(new FitAddon());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState('70vh');
  
  const id = parseInt(serverId || '0');
  
  // Fetch server details
  const { data: server, isLoading, error } = useQuery({
    queryKey: [`/api/servers/${id}`],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest('GET', `/api/servers/${id}`);
      return response.json();
    },
    enabled: !!id
  });
  
  // Setup full screen mode
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Enter fullscreen
      setTerminalHeight('calc(100vh - 60px)');
      setIsFullscreen(true);
      // Fit the terminal to the new size after a brief delay to allow DOM to update
      setTimeout(() => {
        if (terminalInstance.current && fitAddon.current) {
          fitAddon.current.fit();
        }
      }, 100);
    } else {
      // Exit fullscreen
      setTerminalHeight('70vh');
      setIsFullscreen(false);
      // Fit the terminal to the new size
      setTimeout(() => {
        if (terminalInstance.current && fitAddon.current) {
          fitAddon.current.fit();
        }
      }, 100);
    }
  };
  
  // Terminal initialization and connection setup
  useEffect(() => {
    // Redirect to dashboard if no server ID or invalid server ID
    if (!id || isNaN(id)) {
      navigate('/dashboard');
      toast({
        title: 'Error',
        description: 'Invalid server ID provided.',
        variant: 'destructive'
      });
      return;
    }
    
    // Return early if we're still loading server data
    if (isLoading || !server) return;
    
    // Error handling for server data
    if (error || !server) {
      toast({
        title: 'Error',
        description: 'Failed to load server details.',
        variant: 'destructive'
      });
      return;
    }
    
    // Return early if server has no IP address
    if (!server.ipAddress) {
      toast({
        title: 'Server Not Ready',
        description: 'This server does not have an IP address assigned yet. Please wait until the server is fully provisioned.',
        variant: 'destructive'
      });
      return;
    }

    // Initialize terminal
    if (terminalRef.current) {
      // Create terminal if it doesn't exist
      if (!terminalInstance.current) {
        const term = new Terminal({
          cursorBlink: true,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize: 14,
          theme: {
            background: '#1a1b26',
            foreground: '#a9b1d6',
            cursor: '#c0caf5'
          }
        });

        // Register addons
        term.loadAddon(fitAddon.current);
        term.loadAddon(new WebLinksAddon());
        
        // Create DOM element for terminal
        terminalInstance.current = term;
        term.open(terminalRef.current);
        fitAddon.current.fit();
        
        // Connect to server
        connectToServer(term);
      }
    }

    // Handle resize events
    const handleResize = () => {
      if (terminalInstance.current && fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Dispose of terminal instance and close socket
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
        terminalInstance.current = null;
      }
    };
  }, [server, isLoading, error, id, navigate, toast]);

  const connectToServer = (term: Terminal) => {
    // Show connecting message
    term.clear();
    term.write('\r\n\x1b[33mConnecting to server...\x1b[0m\r\n');
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/terminal/${id}`);
    socketRef.current = socket;
    
    socket.onopen = () => {
      term.clear();
      term.write('\r\n\x1b[32mConnected! Authenticating...\x1b[0m\r\n');
      setIsConnected(true);
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'data') {
        term.write(data.data);
      } else if (data.type === 'error') {
        term.write(`\r\n\x1b[31mError: ${data.message}\x1b[0m\r\n`);
      }
    };
    
    socket.onclose = () => {
      term.write('\r\n\x1b[31mConnection closed\x1b[0m\r\n');
      setIsConnected(false);
    };
    
    socket.onerror = (error) => {
      term.write(`\r\n\x1b[31mWebSocket error: ${JSON.stringify(error)}\x1b[0m\r\n`);
      setIsConnected(false);
    };
    
    // Handle terminal input
    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'data', data }));
      }
    });
  };

  const reconnect = () => {
    if (terminalInstance.current) {
      // Close existing socket if any
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      // Connect to server again
      connectToServer(terminalInstance.current);
    }
  };

  // If still loading or error, show placeholders
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!server) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-semibold text-red-500 mb-4">Server Not Found</h1>
          <p className="mb-4">The server you're looking for doesn't exist or you don't have permission to access it.</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`container mx-auto p-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Terminal: {server.name} ({server.ipAddress})
        </h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={reconnect} 
            disabled={!server.ipAddress}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reconnect
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4 mr-1" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-1" />
                Fullscreen
              </>
            )}
          </Button>
          {isFullscreen && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/servers/${id}`)}
            >
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          )}
        </div>
      </div>
      
      <div 
        className={`terminal-container bg-black rounded-md ${isFullscreen ? 'p-2' : 'border border-border'}`}
        style={{ 
          height: terminalHeight,
          overflow: 'hidden',
          transition: 'height 0.2s ease-in-out'
        }}
      >
        <div 
          ref={terminalRef} 
          className="h-full w-full"
        />
      </div>
      
      {!isFullscreen && (
        <div className="mt-4 text-sm text-muted-foreground">
          <p>• Use <kbd className="px-1 py-0.5 rounded bg-muted border">Ctrl+C</kbd> to interrupt commands</p>
          <p>• Type <kbd className="px-1 py-0.5 rounded bg-muted border">exit</kbd> to end your session</p>
          <p>• Connection status: <span className={isConnected ? "text-green-500" : "text-red-500"}>
            {isConnected ? "Connected" : "Disconnected"}
          </span></p>
        </div>
      )}
    </div>
  );
}