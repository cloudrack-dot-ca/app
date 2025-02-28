import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Server } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { Activity, Database, HardDrive, Cpu, MemoryStick, Router, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServerMetricsProps {
  serverId: number;
}

interface MetricData {
  id: number;
  serverId: number;
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  loadAverage: number[];
  uptimeSeconds: number;
}

export default function ServerMonitoring({ serverId }: ServerMetricsProps) {
  const { toast } = useToast();
  const [activeMetric, setActiveMetric] = useState<string>("cpu");
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds default

  // Mock data for fallback when API is not available yet
  const defaultMetric: MetricData = {
    id: 0,
    serverId,
    timestamp: new Date().toISOString(),
    cpuUsage: 25,
    memoryUsage: 40,
    diskUsage: 30,
    networkIn: 1024 * 500, // 500 KB
    networkOut: 1024 * 200, // 200 KB
    loadAverage: [0.5, 0.4, 0.3],
    uptimeSeconds: 3600 * 24 // 1 day
  };

  // Query for latest metrics
  const { 
    data: latestMetric,
    isLoading: isLoadingLatest,
    error: latestError
  } = useQuery<MetricData>({
    queryKey: [`/api/servers/${serverId}/metrics/latest`],
    enabled: !isNaN(serverId),
    refetchInterval: refreshInterval > 0 ? refreshInterval : undefined
  });

  // Query for historical metrics
  const { 
    data: metricsHistoryData,
    isLoading: isLoadingHistory,
    error: historyError
  } = useQuery<MetricData[]>({
    queryKey: [`/api/servers/${serverId}/metrics/history`],
    enabled: !isNaN(serverId),
    refetchInterval: refreshInterval > 0 ? refreshInterval : undefined
  });

  // Server Details Query - to get the server specs for context
  const { data: server } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !isNaN(serverId)
  });

  // Safe access to metrics data with fallbacks
  const currentMetrics = latestMetric || defaultMetric;
  const metricsHistory = metricsHistoryData || [defaultMetric];

  // Force refresh metrics
  const { mutate: refreshServerMetrics, isPending: isRefreshing } = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/servers/${serverId}/metrics/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Metrics refreshed",
        description: "Server performance data has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/metrics/latest`] });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/metrics/history`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error refreshing metrics",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Format data for charts
  const chartData = [...metricsHistory].map((metric: MetricData) => ({
    name: new Date(metric.timestamp).toLocaleTimeString(),
    cpu: metric.cpuUsage,
    memory: metric.memoryUsage,
    disk: metric.diskUsage,
    networkIn: metric.networkIn / 1024 / 1024, // Convert to MB
    networkOut: metric.networkOut / 1024 / 1024, // Convert to MB
    load: metric.loadAverage[0],
  })).reverse(); // Reverse to get chronological order

  // Function to format bytes to a human-readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Function to format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Function to refresh metrics
  const handleRefreshMetrics = () => {
    refreshServerMetrics();
  };

  // Function to toggle auto-refresh
  const toggleAutoRefresh = () => {
    setRefreshInterval(prev => prev ? 0 : 30000);
  };

  // Error handling
  useEffect(() => {
    if (latestError) {
      toast({
        title: "Error loading metrics",
        description: (latestError as Error).message,
        variant: "destructive",
      });
    }
    if (historyError) {
      toast({
        title: "Error loading metrics history",
        description: (historyError as Error).message,
        variant: "destructive",
      });
    }
  }, [latestError, historyError, toast]);

  const specs = server?.specs || { memory: 1024, vcpus: 1, disk: 25 };

  // Loading state
  if (isLoadingLatest && !currentMetrics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2">Loading server metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Monitoring</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAutoRefresh}
          >
            {refreshInterval ? "Auto-refresh: On" : "Auto-refresh: Off"}
          </Button>
          <Button 
            size="sm" 
            onClick={handleRefreshMetrics} 
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Now"}
          </Button>
        </div>
      </div>

      {/* Current Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-500" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{currentMetrics.cpuUsage}%</div>
            <Progress value={currentMetrics.cpuUsage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              Load Avg: {currentMetrics.loadAverage.map((l: number) => l.toFixed(2)).join(', ')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MemoryStick className="h-4 w-4 mr-2 text-green-500" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{currentMetrics.memoryUsage}%</div>
            <Progress value={currentMetrics.memoryUsage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((specs.memory * currentMetrics.memoryUsage) / 100)} MB of {specs.memory} MB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <HardDrive className="h-4 w-4 mr-2 text-orange-500" />
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{currentMetrics.diskUsage}%</div>
            <Progress value={currentMetrics.diskUsage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-1">
              {Math.round((specs.disk * currentMetrics.diskUsage) / 100)} GB of {specs.disk} GB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wifi className="h-4 w-4 mr-2 text-purple-500" />
              Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs mb-1">
              <span className="text-green-500">▲</span> Out: {formatBytes(currentMetrics.networkOut)}/s
            </div>
            <div className="text-xs mb-2">
              <span className="text-blue-500">▼</span> In: {formatBytes(currentMetrics.networkIn)}/s
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Uptime: {formatUptime(currentMetrics.uptimeSeconds)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Data Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeMetric} onValueChange={setActiveMetric}>
            <TabsList className="mb-4">
              <TabsTrigger value="cpu">CPU</TabsTrigger>
              <TabsTrigger value="memory">Memory</TabsTrigger>
              <TabsTrigger value="disk">Disk</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
            </TabsList>

            <TabsContent value="cpu" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#3b82f680" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="memory" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Area type="monotone" dataKey="memory" stroke="#22c55e" fill="#22c55e80" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="disk" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Area type="monotone" dataKey="disk" stroke="#f97316" fill="#f9731680" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="network" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${typeof value === 'number' ? value.toFixed(2) : value} MB/s`} />
                  <Bar dataKey="networkIn" name="In" fill="#3b82f6" />
                  <Bar dataKey="networkOut" name="Out" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}