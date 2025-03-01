import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

// Define the message types for type safety
export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

interface WebSocketContextType {
  connected: boolean;
  subscribeToTicket: (ticketId: number) => void;
  unsubscribeFromTicket: (ticketId: number) => void;
  ticketUpdates: Map<number, any[]>;
}

const WebSocketContext = React.createContext<WebSocketContextType | null>(null);

// Feature flag to disable WebSockets entirely when debugging
const WEBSOCKET_ENABLED = false;

// WebSocket host determined by current host
const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [ticketUpdates, setTicketUpdates] = useState<Map<number, any[]>>(new Map());
  
  // Reference to the WebSocket connection
  const ws = useRef<WebSocket | null>(null);
  // Track subscribed tickets
  const subscribedTickets = useRef<Set<number>>(new Set());
  // Track reconnection attempts
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  // Track if connection is in progress to prevent multiple simultaneous connections
  const isConnecting = useRef(false);

  // Handle custom events for toast notifications to avoid circular dependencies
  useEffect(() => {
    const handleNewTicketMessage = (event: Event) => {
      const customEvent = event as CustomEvent<{ ticketId: number }>;
      toast({
        title: 'New message',
        description: `New message in ticket #${customEvent.detail.ticketId}`,
      });
    };
    
    const handleConnectionError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>;
      toast({
        title: 'Connection issue',
        description: customEvent.detail.message,
        variant: 'destructive'
      });
    };
    
    // Listen for our custom events
    window.addEventListener('new-ticket-message', handleNewTicketMessage);
    window.addEventListener('websocket-connection-error', handleConnectionError);
    
    return () => {
      window.removeEventListener('new-ticket-message', handleNewTicketMessage);
      window.removeEventListener('websocket-connection-error', handleConnectionError);
    };
  }, [toast]);

  // Function to send authenticated messages - no dependencies
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Store user ID in a ref to avoid dependency issues
  const userIdRef = useRef<number | null>(null);
  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  // Handle establishing WebSocket connection - no toast or sendMessage in dependencies
  const connectWebSocket = useCallback(() => {
    // If WebSockets are disabled via feature flag, don't connect
    if (!WEBSOCKET_ENABLED) return;

    const currentUserId = userIdRef.current;
    if (!currentUserId || isConnecting.current) return;
    
    isConnecting.current = true;
    
    try {
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }

      // Create new WebSocket connection
      const socket = new WebSocket(getWsUrl());
      ws.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        reconnectAttempts.current = 0;
        isConnecting.current = false;

        // Authenticate with user ID
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({
            type: 'auth',
            userId: currentUserId
          }));
        }

        // Resubscribe to any previously subscribed tickets
        subscribedTickets.current.forEach(ticketId => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              type: 'subscribe',
              ticketId,
              userId: currentUserId
            }));
          }
        });
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        isConnecting.current = false;
        
        // Only attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          if (reconnectTimeoutId.current) {
            clearTimeout(reconnectTimeoutId.current);
          }
          
          reconnectTimeoutId.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          console.log('Max reconnection attempts reached. Please refresh the page.');
          // Don't show error message for now
          setConnected(false);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnecting.current = false;
        // Don't show error message for now
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          switch (message.type) {
            case 'auth_success':
              console.log('Authentication successful');
              break;
              
            case 'subscribe_success':
              console.log(`Subscribed to ticket ${message.ticketId}`);
              break;
              
            case 'ticket_update':
              // Handle ticket update messages
              if (message.ticketId && message.data) {
                console.log(`Received update for ticket ${message.ticketId}`, message.data);
                
                setTicketUpdates(prev => {
                  const newMap = new Map(prev);
                  
                  // Get current updates or initialize empty array
                  const updates = newMap.get(message.ticketId) || [];
                  
                  // Add new update to the beginning of the array
                  newMap.set(message.ticketId, [message.data, ...updates]);
                  
                  return newMap;
                });
                  
                // Notify user of new message if this is a message update
                if (message.data.message) {
                  // We'll dispatch a custom event to avoid dependency cycles with toast
                  window.dispatchEvent(new CustomEvent('new-ticket-message', { 
                    detail: { ticketId: message.ticketId }
                  }));
                }
              }
              break;
              
            default:
              console.log('Unknown message type:', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
      isConnecting.current = false;
    }

    return () => {
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      isConnecting.current = false;
    };
  }, []);

  // Connect when the component mounts and user is logged in
  useEffect(() => {
    // Only attempt connection if WebSockets are enabled
    if (WEBSOCKET_ENABLED && userIdRef.current) {
      // Use setTimeout to delay the connection attempt slightly
      const timer = setTimeout(() => {
        connectWebSocket();
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        if (ws.current) {
          ws.current.close();
          ws.current = null;
        }
        
        if (reconnectTimeoutId.current) {
          clearTimeout(reconnectTimeoutId.current);
        }
        isConnecting.current = false;
      };
    }
    return undefined;
  }, [connectWebSocket]);

  // Function to subscribe to a ticket
  const subscribeToTicket = useCallback((ticketId: number) => {
    // If WebSockets are disabled, don't try to subscribe
    if (!WEBSOCKET_ENABLED) return;
    
    const currentUserId = userIdRef.current;
    if (!currentUserId) return;
    
    // Add to our tracked subscriptions
    subscribedTickets.current.add(ticketId);
    
    // Send subscription request if connected
    if (connected && ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'subscribe',
        ticketId,
        userId: currentUserId
      }));
    }
  }, [connected]);

  // Function to unsubscribe from a ticket
  const unsubscribeFromTicket = useCallback((ticketId: number) => {
    // Remove from our tracked subscriptions
    subscribedTickets.current.delete(ticketId);
    
    // We don't need to explicitly unsubscribe on the server
    // as the server will automatically clean up when the WebSocket closes
  }, []);

  const value = {
    connected: WEBSOCKET_ENABLED ? connected : false,
    subscribeToTicket,
    unsubscribeFromTicket,
    ticketUpdates
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = React.useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}