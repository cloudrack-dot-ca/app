import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Minimize2, Move } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import 'xterm/css/xterm.css';

interface ServerTerminalProps {
  serverId: number;
  serverName: string;
  ipAddress: string;
}

export default function ServerTerminal({ serverId, serverName, ipAddress }: ServerTerminalProps) {
  const { user } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

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
    
    // Make sure to fit terminal after a small delay to allow the DOM to settle
    setTimeout(() => {
      fit.fit();
    }, 100);

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
      
      // Clear terminal and show connecting message
      term.clear();
      term.writeln('\x1b[1;32mInitiating connection to server...\x1b[0m');
      term.writeln(`\x1b[1;34mConnecting to ${serverName} (${ipAddress})...\x1b[0m`);
      
      // Connect to real terminal socket server
      const socket = io(`${window.location.origin}/terminal`, {
        query: {
          serverId: serverId.toString(),
          userId: user?.id.toString() || ''
        }
      });
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
      
      // Handle ready event - terminal is ready to accept input
      socket.on('ready', () => {
        term.writeln('\x1b[1;32mTerminal ready!\x1b[0m');
        term.writeln('\x1b[1;34mYou can start typing commands now.\x1b[0m');
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
    const newFullscreenState = !isFullScreen;
    setIsFullScreen(newFullscreenState);
    
    // Add/remove body scroll lock when entering/exiting fullscreen
    if (newFullscreenState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Give the DOM time to update, then resize the terminal to fill the new space
    setTimeout(() => {
      if (fitAddon) {
        fitAddon.fit();
        
        // Update terminal dimensions and emit resize event
        if (terminal && socketRef.current?.connected) {
          const dims = terminal.rows && terminal.cols ? 
            { rows: terminal.rows, cols: terminal.cols } : 
            { rows: 24, cols: 80 };
          socketRef.current.emit('resize', dims);
        }
        
        // Focus the terminal when entering fullscreen
        if (newFullscreenState && terminal) {
          terminal.focus();
        }
      }
    }, 100);
  };

  // Effect to handle fitting when fullscreen changes
  useEffect(() => {
    if (isFullScreen && fitAddon) {
      fitAddon.fit();
      
      // Add event listener for ESC key to exit fullscreen
      const handleEscKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullScreen) {
          toggleFullScreen();
        }
      };
      
      window.addEventListener('keydown', handleEscKey);
      
      return () => {
        window.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isFullScreen, fitAddon]);
  
  // Clean up body overflow when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className={`relative ${isFullScreen ? 'fixed inset-0 z-[100] bg-background' : ''}`}>
      {/* Overlay when in fullscreen to prevent interaction with elements behind */}
      {isFullScreen && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      )}
      
      {connectionError && (
        <div className={`bg-red-500/10 text-red-500 p-3 rounded-md ${isFullScreen ? 'absolute top-4 left-4 right-4 z-10' : 'mb-4'}`}>
          {connectionError}
        </div>
      )}
      
      <div 
        className={`
          border rounded-md overflow-hidden relative
          ${isFullScreen 
            ? 'absolute inset-4 h-[calc(100vh-32px)] w-[calc(100vw-32px)] z-10 shadow-xl' 
            : 'h-[400px]'}
        `}
      >
        {isFullScreen && (
          <div className="absolute bottom-2 right-2 text-gray-400/40 z-10 pointer-events-none">
            <Move className="h-6 w-6" />
          </div>
        )}
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
          onClick={() => {
            if (isFullScreen && terminal) {
              terminal.focus();
            }
          }}
        />
      </div>
      
      {isFullScreen && (
        <div className="absolute bottom-6 right-6 z-20">
          <Button 
            variant="secondary" 
            onClick={toggleFullScreen}
            className="shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-all"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Exit Full Screen
            <span className="ml-2 opacity-70 text-xs">Esc</span>
          </Button>
        </div>
      )}
    </div>
  );
}