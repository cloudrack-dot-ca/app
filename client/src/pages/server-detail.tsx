import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Server, Volume } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  HardDrive, 
  Server as ServerIcon, 
  ArrowLeft, 
  Trash2, 
  RefreshCw, 
  Power, 
  PowerOff, 
  Terminal,
  CopyPlus,
  Edit,
  Save,
  Globe,
  Wifi,
  Shield,
  BarChart
} from "lucide-react";
import VolumeManager from "@/components/volume-manager";
import ServerMonitoring from "@/components/server-monitoring";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Map regions to flag emojis
const regionFlags: { [key: string]: string } = {
  'nyc1': '🇺🇸 New York',
  'sfo1': '🇺🇸 San Francisco',
  'ams1': '🇳🇱 Amsterdam',
  'sgp1': '🇸🇬 Singapore',
  'lon1': '🇬🇧 London',
  'fra1': '🇩🇪 Frankfurt',
  'tor1': '🇨🇦 Toronto',
  'blr1': '🇮🇳 Bangalore',
};

export default function ServerDetailPage() {
  // Extract and validate params - simplified approach for better compatibility
  const params = useParams<{ id: string }>();
  const pathId = params?.id;
  
  // Debug info
  console.log("ServerDetailPage Params:", params);
  console.log("Path ID:", pathId);
  console.log("URL Path:", window.location.pathname);
  
  // Parse the server ID from the URL
  let serverId: number = -1;
  
  if (pathId) {
    try {
      // Parse the server ID
      serverId = parseInt(pathId);
      
      // If we get an invalid ID, show an error
      if (isNaN(serverId) || serverId <= 0) {
        console.error("Invalid server ID in URL:", pathId);
        serverId = -1; // Use an invalid ID that will be caught by the error handling
      } else {
        console.log("Valid server ID found:", serverId);
      }
    } catch (err) {
      console.error("Error parsing server ID:", err);
      serverId = -1;
    }
  } else {
    // As a fallback, try to extract ID from URL pathname
    const pathMatch = window.location.pathname.match(/\/servers\/(\d+)/);
    if (pathMatch && pathMatch[1]) {
      try {
        serverId = parseInt(pathMatch[1]);
        console.log("Extracted server ID from URL path:", serverId);
      } catch (e) {
        console.error("Failed to parse ID from URL path");
      }
    } else {
      console.error("No server ID provided in URL");
    }
  }
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [ipv6Enabled, setIpv6Enabled] = useState(false);
  
  // Parse URL to check for tab query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "overview");
  
  // Fetch server details directly with a simplified approach
  const { data: server, isLoading: serverLoading, error: serverError, refetch: refetchServer } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !isNaN(serverId) && !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 10000, // Shorter stale time for more responsive UI
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch when component mounts
  });
  
  // Log any server fetch errors to help debug
  useEffect(() => {
    if (serverError) {
      console.error("Error fetching server:", serverError);
      toast({
        title: "Error loading server",
        description: (serverError as Error).message,
        variant: "destructive",
      });
    }
  }, [serverError, toast]);

  // Fetch volumes attached to this server
  const { data: volumes = [], isLoading: volumesLoading } = useQuery<Volume[]>({
    queryKey: [`/api/servers/${serverId}/volumes`],
    enabled: !isNaN(serverId) && !!user && !!server,
  });

  // Server action mutations
  const rebootServerMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/servers/${serverId}/actions/reboot`);
    },
    onSuccess: () => {
      toast({
        title: "Server Rebooting",
        description: "The server is now rebooting.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reboot server",
        variant: "destructive",
      });
    }
  });

  const powerActionMutation = useMutation({
    mutationFn: async (action: "start" | "stop") => {
      return await apiRequest("POST", `/api/servers/${serverId}/actions/${action}`);
    },
    onSuccess: (_data, variables) => {
      toast({
        title: variables === "start" ? "Server Starting" : "Server Stopping",
        description: `The server is now ${variables === "start" ? "starting up" : "shutting down"}.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform power action",
        variant: "destructive",
      });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      // Updated to specifically mention DigitalOcean integration
      return await apiRequest("PATCH", `/api/servers/${serverId}/password`, { 
        password,
        digital_ocean_integration: true  // Flag to indicate we're using DigitalOcean API for this
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Updated via DigitalOcean",
        description: "Your server password has been updated through the DigitalOcean API and will be effective immediately.",
      });
      setIsEditingPassword(false);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Digital Ocean API Error",
        description: error.message || "Failed to update password through DigitalOcean API. Please try again.",
        variant: "destructive",
      });
    }
  });

  const toggleIPv6Mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("PATCH", `/api/servers/${serverId}/ipv6`, { enabled });
    },
    onSuccess: (_, variables) => {
      setIpv6Enabled(variables);
      toast({
        title: variables ? "IPv6 Enabled" : "IPv6 Disabled",
        description: `IPv6 is now ${variables ? "enabled" : "disabled"} for this server.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update IPv6 settings",
        variant: "destructive",
      });
    }
  });

  const deleteServerMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/servers/${serverId}`);
    },
    onSuccess: () => {
      toast({
        title: "Server Deleted",
        description: "Your server has been successfully deleted.",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete server",
        variant: "destructive",
      });
    },
  });

  // Set IPv6 status when server data is loaded
  useEffect(() => {
    if (server) {
      setIpv6Enabled(!!server.ipv6Address);
    }
  }, [server]);

  if (serverLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading server details...</span>
        </div>
      </div>
    );
  }

  if (!server) {
    // Add console logging to help diagnose the issue
    console.log("Server data not available:", { serverError, serverId, userLoggedIn: !!user });
    
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Server not found</h2>
          <p className="text-muted-foreground mt-2">
            {serverError 
              ? `Error: ${(serverError as Error).message}` 
              : "The requested server could not be found or you don't have permission to access it."}
          </p>
          <div className="mt-6 space-y-4">
            <Button 
              className="mx-2" 
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </Button>
            <div className="flex flex-col gap-2 items-center mt-2">
              <Button
                variant="outline"
                className="mx-2"
                onClick={() => {
                  // Refetch both user and server data
                  refetchUser();
                  refetchServer(); // Use the refetch function directly
                  
                  toast({
                    title: "Refreshing data",
                    description: "Attempting to reload server information...",
                  });
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <p className="text-xs text-muted-foreground">
                If problems persist, try refreshing the page or logging out and back in
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const specs = server.specs || { memory: 1024, vcpus: 1, disk: 25 };
  const isRunning = server.status === "active" || server.status === "starting" || server.status === "rebooting";

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">{server.name}</h1>
        <Badge variant={
          server.status === "active" 
            ? "default" 
            : (server.status === "starting" || server.status === "rebooting" || server.status === "stopping")
              ? "outline"
              : "secondary"
        }>
          {server.status}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <ServerIcon className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="volumes">
            <HardDrive className="h-4 w-4 mr-2" />
            Volumes
          </TabsTrigger>
          <TabsTrigger value="networking">
            <Globe className="h-4 w-4 mr-2" />
            Networking
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <BarChart className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="console">
            <Terminal className="h-4 w-4 mr-2" />
            Console
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Server Specifications */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Server Specifications</CardTitle>
                <CardDescription>Technical details about your server</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Hardware</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Memory</span>
                        <span className="font-medium">{specs.memory / 1024}GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>vCPUs</span>
                        <span className="font-medium">{specs.vcpus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Disk</span>
                        <span className="font-medium">{specs.disk}GB SSD</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Region</span>
                        <span className="font-medium">{regionFlags[server.region] || server.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size</span>
                        <span className="font-medium">{server.size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Application</span>
                        <span className="font-medium">{server.application || "No Application"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Root Password</p>
                      <p className="text-xs text-muted-foreground">Used for console access</p>
                    </div>
                    
                    {isEditingPassword ? (
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="w-48"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => updatePasswordMutation.mutate(newPassword)}
                          disabled={updatePasswordMutation.isPending || !newPassword}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingPassword(false);
                            setNewPassword("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPassword(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Volume Summary */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Storage</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p>{volumes.length} Volume{volumes.length !== 1 ? 's' : ''} Attached</p>
                      <p className="text-xs text-muted-foreground">
                        {volumes.reduce((total, v) => total + v.size, 0)}GB additional storage
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                    >
                      <Link href={`/servers/${serverId}?tab=volumes`}>
                        <HardDrive className="h-4 w-4 mr-2" />
                        Manage Volumes
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Server Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Server Controls</CardTitle>
                <CardDescription>Manage your server state</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={isRunning ? "outline" : "default"} 
                    onClick={() => powerActionMutation.mutate("start")}
                    disabled={isRunning || powerActionMutation.isPending}
                    className="w-full"
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Power On
                  </Button>
                  <Button 
                    variant={!isRunning ? "outline" : "default"} 
                    onClick={() => powerActionMutation.mutate("stop")}
                    disabled={!isRunning || powerActionMutation.isPending}
                    className="w-full"
                  >
                    <PowerOff className="h-4 w-4 mr-2" />
                    Power Off
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => rebootServerMutation.mutate()}
                  disabled={!isRunning || rebootServerMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reboot
                </Button>

                <Separator />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Server
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Server</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this server? This action cannot be undone
                        and all data on the server will be permanently lost.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteServerMutation.mutate()}
                        disabled={deleteServerMutation.isPending}
                      >
                        {deleteServerMutation.isPending ? "Deleting..." : "Delete Server"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Volumes Tab */}
        <TabsContent value="volumes">
          <Card>
            <CardHeader>
              <CardTitle>Volume Management</CardTitle>
              <CardDescription>
                Attach additional block storage to your server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VolumeManager serverId={serverId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Networking Tab */}
        <TabsContent value="networking">
          <Card>
            <CardHeader>
              <CardTitle>Network Configuration</CardTitle>
              <CardDescription>
                Manage your server's network settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">IP Addresses</h3>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">IPv4 Address</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm">{server.ipAddress}</code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              navigator.clipboard.writeText(server.ipAddress || "");
                              toast({
                                title: "Copied",
                                description: "IP address copied to clipboard",
                              });
                            }}
                          >
                            <CopyPlus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">IPv6 Address</span>
                        <div>
                          {ipv6Enabled && server.ipv6Address ? (
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm">{server.ipv6Address}</code>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  navigator.clipboard.writeText(server.ipv6Address || "");
                                  toast({
                                    title: "Copied",
                                    description: "IPv6 address copied to clipboard",
                                  });
                                }}
                              >
                                <CopyPlus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not enabled</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant={ipv6Enabled ? "default" : "outline"}
                        size="sm" 
                        onClick={() => toggleIPv6Mutation.mutate(!ipv6Enabled)}
                        disabled={toggleIPv6Mutation.isPending}
                      >
                        {ipv6Enabled ? (
                          <>
                            <Wifi className="h-4 w-4 mr-2" />
                            Disable IPv6
                          </>
                        ) : (
                          <>
                            <Wifi className="h-4 w-4 mr-2" />
                            Enable IPv6
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Firewall</h3>
                <div className="bg-card border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-medium">Basic Firewall Rules</h4>
                      <p className="text-xs text-muted-foreground">Configure basic firewall rules for your server</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      Configure Firewall
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                      <div className="flex items-center">
                        <div className="bg-green-100 text-green-800 p-1 rounded-full mr-3">
                          <ServerIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">SSH (22)</p>
                          <p className="text-xs text-muted-foreground">Allow SSH access to your server</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 bg-green-50">Allowed</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                      <div className="flex items-center">
                        <div className="bg-green-100 text-green-800 p-1 rounded-full mr-3">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">HTTP (80)</p>
                          <p className="text-xs text-muted-foreground">Web server traffic</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 bg-green-50">Allowed</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                      <div className="flex items-center">
                        <div className="bg-green-100 text-green-800 p-1 rounded-full mr-3">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">HTTPS (443)</p>
                          <p className="text-xs text-muted-foreground">Secure web traffic</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 bg-green-50">Allowed</Badge>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    Note: Advanced firewall management through the DigitalOcean Cloud Firewall is being implemented. 
                    The interface above shows the default configuration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Monitor your server's resource usage and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServerMonitoring serverId={serverId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Console Tab */}
        <TabsContent value="console">
          <Card>
            <CardHeader>
              <CardTitle>Server Console</CardTitle>
              <CardDescription>
                Access your server's command line interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="bg-black text-green-400 p-4 h-[400px] rounded-md font-mono overflow-auto">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-800">
                    <span className="text-xs">Connected to {server.name} ({server.ipAddress})</span>
                    <div className="flex space-x-2">
                      <span className="animate-pulse text-xs">●</span>
                      <span className="text-xs">Active connection</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-4">
                    <p>Welcome to Ubuntu 22.04.3 LTS</p>
                    <p>Last login: {new Date().toUTCString()}</p>
                    <p>System information as of {new Date().toLocaleDateString()}</p>
                    <p>&nbsp;</p>
                    <p>System load:  0.8              Users logged in:      1</p>
                    <p>Usage of /:   25.1% of 24.06GB IPv4 address:         {server.ipAddress}</p>
                    <p>Memory usage: 18%              Swap usage:           0%</p>
                    <p>&nbsp;</p>
                    <p>● System information:        <span className="text-green-200">{server.application || "Generic"}</span></p>
                    <p>● CPU:                       <span className="text-green-200">{specs.vcpus} vCPU(s)</span></p>
                    <p>● Memory:                    <span className="text-green-200">{specs.memory / 1024}GB</span></p>
                    <p>● Disk:                      <span className="text-green-200">{specs.disk}GB SSD</span></p>
                    <p>&nbsp;</p>
                    <p>root@{server.name}:~# <span className="animate-pulse">_</span></p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reconnect
                    </Button>
                    <Button variant="outline" size="sm">
                      <Terminal className="h-4 w-4 mr-2" />
                      Full Screen
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <span className="text-xs text-muted-foreground">
                      Note: This is a simulation. In a production environment, this would be a real terminal connection.
                    </span>
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">SSH Access</h3>
                <p className="text-sm mb-4">Connect to your server via SSH using the following command:</p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm flex justify-between items-center">
                  <code>ssh root@{server.ipAddress}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(`ssh root@${server.ipAddress}`);
                      toast({
                        title: "Copied",
                        description: "SSH command copied to clipboard",
                      });
                    }}
                  >
                    <CopyPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}