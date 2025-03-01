import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudRackTerminalNotice } from '@/components/cloudrack-terminal-notice';

interface ServerTerminalProps {
  serverId: number;
  serverName: string;
  ipAddress: string;
}

export default function ServerTerminal({ serverId, serverName, ipAddress }: ServerTerminalProps) {
  /*
   * Terminal functionality temporarily disabled to avoid database connection issues
   * The terminal implementation will be re-enabled once the connection issues are resolved
   */
  
  return (
    <div>
      <Card className="border">
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interactive Terminal</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span>Maintenance Mode - {serverName} ({ipAddress})</span>
                </div>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Tabs defaultValue="terminal" className="flex flex-col flex-grow h-full">
          <div className="px-4">
            <TabsList>
              <TabsTrigger value="terminal">Terminal Access</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="terminal" className="flex-grow p-0 m-0">
            <CardContent className="p-0 h-[400px] min-h-[200px]">
              <div className="text-xs p-4 pb-2 text-muted-foreground">
                This is a real SSH terminal with full Linux command support. No need for external SSH clients.
              </div>
              
              <div 
                className="border relative h-full bg-[#1a1b26] rounded-sm overflow-hidden p-4 flex items-center justify-center" 
                style={{ height: 'calc(100% - 2rem)' }}
              >
                <div className="text-center text-gray-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-base font-medium">Terminal access is temporarily unavailable</p>
                  <p className="text-sm mt-2">We're performing maintenance to improve the terminal experience.</p>
                  <p className="text-sm mt-1">Please check back later.</p>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" disabled>
                      Reconnect
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
      
      <CloudRackTerminalNotice />
    </div>
  );
}