import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
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

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

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
  }, [serverId]);

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
      
      // Clear terminal and show connecting message
      term.clear();
      term.writeln('\x1b[1;32mInitiating connection to server...\x1b[0m');
      term.writeln(`\x1b[1;34mConnecting to ${serverName} (${ipAddress})...\x1b[0m`);
      
      // Connect to real terminal socket server
      const socket = io(`${window.location.origin}/terminal?serverId=${serverId}`);
      socketRef.current = socket;
      
      // Handle successful connection
      socket.on('connect', () => {
        console.log('Connected to terminal socket server');
        term.writeln('\x1b[1;32mSocket connection established!\x1b[0m');
        setIsConnected(true);
      });
      
      // Handle connection error
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        term.writeln('\x1b[1;31mSocket connection error: ' + error.message + '\x1b[0m');
        setConnectionError(`Connection error: ${error.message}`);
        setIsConnected(false);
      });
      
      // Handle terminal data from server
      socket.on('data', (data) => {
        term.write(data);
      });
      
      // Handle status messages from server
      socket.on('status', (data) => {
        term.writeln(`\x1b[1;33m${data.message}\x1b[0m`);
      });
      
      // Handle server errors
      socket.on('error', (message) => {
        term.writeln(`\x1b[1;31mError: ${message}\x1b[0m`);
        setConnectionError(message);
      });
      
      // Handle authentication requests
      socket.on('auth_request', (data) => {
        term.writeln(`\x1b[1;36m${data.prompt}\x1b[0m`);
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Disconnected from terminal socket server');
        term.writeln('\x1b[1;31mDisconnected from server\x1b[0m');
        setIsConnected(false);
      });
      
      // Handle terminal input - send to server
      term.onData(data => {
        if (socket.connected) {
          socket.emit('data', data);
        }
      });
      
      // Handle window resize
      const resizeObserver = new ResizeObserver(() => {
        if (fitAddon) {
          fitAddon.fit();
          if (socket.connected) {
            const dims = term.rows && term.cols ? 
              { rows: term.rows, cols: term.cols } : 
              { rows: 24, cols: 80 };
            socket.emit('resize', dims);
          }
        }
      });
      
      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }
      
      // Return cleanup function
      return () => {
        if (terminalRef.current) {
          resizeObserver.unobserve(terminalRef.current);
        }
        socket.disconnect();
      };
      
    } catch (error) {
      console.error('Failed to connect to terminal server:', error);
      setConnectionError('Failed to connect to terminal server. Please try again.');
      setIsConnected(false);
    }
  };

  // No need for simulated command processing now that we're connecting to real server

  // Reconnect terminal
  const handleReconnect = () => {
    if (terminal) {
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