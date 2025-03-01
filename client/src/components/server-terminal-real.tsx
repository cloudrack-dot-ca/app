import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import 'xterm/css/xterm.css';

interface ServerTerminalProps {
  serverId: number;
  serverName: string;
  ipAddress: string;
}

export default function ServerTerminal({ serverId, serverName, ipAddress }: ServerTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const { user } = useAuth();

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || !user) return;

    // Clear any existing terminal
    terminalRef.current.innerHTML = '';

    // Initialize XTerm
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
        cursor: '#f7f7f7',
        selectionBackground: 'rgba(128, 203, 196, 0.3)',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#787c99',
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#acb0d0',
      }
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());

    // Open terminal in the container
    term.open(terminalRef.current);
    fit.fit();

    // Store references
    setTerminal(term);
    setFitAddon(fit);

    // Handle window resize
    const handleResize = () => {
      if (fit) fit.fit();
    };
    window.addEventListener('resize', handleResize);

    // Initial connection
    connectToServer(term);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [serverId, user]);

  // Handle full screen mode changes
  useEffect(() => {
    if (fitAddon) {
      setTimeout(() => {
        fitAddon.fit();
      }, 100);
    }
  }, [isFullScreen, fitAddon]);

  // Connect to WebSocket server
  const connectToServer = (term: Terminal) => {
    try {
      setConnectionError(null);
      
      term.clear();
      term.writeln('\x1b[1;32mInitiating connection to server...\x1b[0m');
      term.writeln(`\x1b[1;34mConnecting to ${serverName} (${ipAddress})...\x1b[0m`);
      
      // Create a socket.io connection to the server with query parameters
      const socket = io(`${window.location.origin}`, {
        query: {
          serverId: serverId.toString(),
          userId: user?.id.toString()
        }
      });
      
      socketRef.current = socket;
      
      // Handle socket events
      socket.on('connect', () => {
        console.log('Socket connected');
      });
      
      socket.on('status', (data: { status: string }) => {
        if (data.status === 'connected') {
          setIsConnected(true);
          term.writeln('\x1b[1;32mConnection established!\x1b[0m');
        } else if (data.status === 'disconnected') {
          setIsConnected(false);
          term.writeln('\x1b[1;31mConnection closed.\x1b[0m');
        }
      });
      
      socket.on('data', (data: string) => {
        term.write(data);
      });
      
      socket.on('error', (error: string) => {
        console.error('Terminal error:', error);
        setConnectionError(error);
        term.writeln(`\x1b[1;31mError: ${error}\x1b[0m`);
        setIsConnected(false);
      });
      
      socket.on('disconnect', () => {
        setIsConnected(false);
        term.writeln('\x1b[1;31mDisconnected from server.\x1b[0m');
      });
      
      // Handle user input in the terminal
      term.onData((data) => {
        if (socket && socket.connected) {
          socket.emit('data', data);
        }
      });
      
      // Handle terminal resize
      const handleTerminalResize = () => {
        if (socket && socket.connected) {
          socket.emit('resize', {
            cols: term.cols,
            rows: term.rows
          });
        }
      };
      
      // Set up resize handler
      if (fitAddon) {
        // Store the original fit function
        const originalFit = fitAddon.fit;
        
        // Override the fit function to emit a resize event after fitting
        fitAddon.fit = function() {
          originalFit.call(fitAddon);
          handleTerminalResize();
        };
      }
      
    } catch (error: any) {
      console.error('Failed to connect to terminal server:', error);
      setConnectionError('Failed to connect to terminal server. Please try again.');
      setIsConnected(false);
    }
  };

  // Reconnect terminal
  const handleReconnect = () => {
    if (terminal) {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      terminal.clear();
      connectToServer(terminal);
    }
  };

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className={`relative ${isFullScreen ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}>
      {connectionError && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-4">
          {connectionError}
        </div>
      )}
      
      <div 
        className={`
          border rounded-md overflow-hidden
          ${isFullScreen ? 'h-[calc(100vh-100px)]' : 'h-[400px]'}
        `}
      >
        <div className="bg-gray-800 text-gray-300 p-2 flex justify-between items-center text-xs">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'} - {serverName} ({ipAddress})
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={handleReconnect}
              title="Reconnect"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={toggleFullScreen}
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullScreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        <div 
          ref={terminalRef} 
          className="h-full"
        />
      </div>
      
      {isFullScreen && (
        <div className="absolute bottom-6 right-6">
          <Button 
            variant="secondary" 
            onClick={toggleFullScreen}
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Exit Full Screen
          </Button>
        </div>
      )}
    </div>
  );
}