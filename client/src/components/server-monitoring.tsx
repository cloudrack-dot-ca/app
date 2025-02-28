import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Server } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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

interface ServerMetric {
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
  const [refreshInterval, setRefreshInterval] = useState<number | null>(10000); // 10 seconds default

  // Mock data for now, in real implementation this would come from the API
  const mockMetrics: ServerMetric[] = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    serverId,
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
    cpuUsage: Math.floor(Math.random() * 70) + 10, // 10-80%
    memoryUsage: Math.floor(Math.random() * 60) + 20, // 20-80%
    diskUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
    networkIn: Math.floor(Math.random() * 10000000), // 0-10MB
    networkOut: Math.floor(Math.random() * 5000000), // 0-5MB
    loadAverage: [
      Math.random() * 2, 
      Math.random() * 1.5, 
      Math.random() * 1
    ],
    uptimeSeconds: 3600 * 24 * (i + 1), // Increasing uptime
  }));

  // Current metrics (latest)
  const currentMetrics = mockMetrics[mockMetrics.length - 1];

  // Server Details Query - would be used to get the server specs for context
  const { data: server } = useQuery<Server>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !isNaN(serverId),
  });

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

  // Format data for charts
  const chartData = mockMetrics.map(metric => ({
    name: new Date(metric.timestamp).toLocaleTimeString(),
    cpu: metric.cpuUsage,
    memory: metric.memoryUsage,
    disk: metric.diskUsage,
    networkIn: metric.networkIn / 1024 / 1024, // Convert to MB
    networkOut: metric.networkOut / 1024 / 1024, // Convert to MB
    load: metric.loadAverage[0],
  }));

  // Mock refresh data - in a real app this would fetch from API
  useEffect(() => {
    if (!refreshInterval) return;
    
    const timer = setInterval(() => {
      // In a real implementation, this would trigger a refresh of the metrics data
      // queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/metrics`] });
    }, refreshInterval);
    
    return () => clearInterval(timer);
  }, [refreshInterval, serverId]);

  // Function to simulate refreshing metrics
  const refreshMetrics = () => {
    toast({
      title: "Refreshing metrics",
      description: "Fetching the latest server performance data.",
    });
    // In a real implementation, this would trigger a refresh
    // queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/metrics`] });
  };

  // Function to toggle auto-refresh
  const toggleAutoRefresh = () => {
    setRefreshInterval(prev => prev ? null : 10000);
  };

  const specs = server?.specs || { memory: 1024, vcpus: 1, disk: 25 };

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
          <Button size="sm" onClick={refreshMetrics}>
            Refresh Now
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
              Load Avg: {currentMetrics.loadAverage.map(l => l.toFixed(2)).join(', ')}
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