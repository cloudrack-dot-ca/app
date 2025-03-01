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
  const { id } = useParams<{ id: string }>();
  const serverId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [ipv6Enabled, setIpv6Enabled] = useState(false);
  
  // Fetch server details with explicit queryFn to better handle errors
  const { data: server, isLoading: serverLoading, error: serverError } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !isNaN(serverId) && !!user,
    retry: 3,
    retryDelay: 1000,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    queryFn: async ({ queryKey }) => {
      console.log("Fetching server details for ID:", serverId, "User:", user?.id);
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        console.error(`Server fetch error (${res.status}):`, text);
        
        if (res.status === 401) {
          throw new Error("Authentication required. Please log in again.");
        } else if (res.status === 404) {
          throw new Error("Server not found or you don't have access to it.");
        }
        
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || json.error || `${res.status}: ${res.statusText}`);
        } catch (e) {
          throw new Error(`Error ${res.status}: ${text || res.statusText}`);
        }
      }
      
      return res.json();
    }
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
      return await apiRequest("PATCH", `/api/servers/${serverId}/password`, { password });
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your server password has been updated successfully.",
      });
      setIsEditingPassword(false);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
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
            {serverError && (
              <Button
                variant="outline"
                className="mx-2"
                onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}`] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
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

      <Tabs defaultValue="overview" className="w-full">
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
                <div className="bg-muted p-4 rounded-lg text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Firewall management will be available soon</p>
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
              <div className="bg-black text-green-400 p-4 h-[400px] rounded-md font-mono overflow-auto">
                <p>// Server console access is not available in this demo version.</p>
                <p>// In a production environment, this would display:</p>
                <p>// - A web-based terminal connected to your server</p>
                <p>// - SSH connection instructions</p>
                <p className="mt-4">$ ssh root@{server.ipAddress}</p>
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