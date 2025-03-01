import { useQuery } from "@tanstack/react-query";
import { Volume } from "@shared/schema";
import VolumeManager from "@/components/volume-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VolumesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState<number | null>(null);
  const { data: volumes = [], isLoading, refetch } = useQuery<Volume[]>({
    queryKey: ["/api/volumes"],
  });

  // Setup auto-refresh if enabled
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, autoRefresh * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  // Handle manual refresh
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing data",
      description: "Fetching the latest volume information..."
    });
  };

  // Handle toggling auto-refresh
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      setAutoRefresh(null);
      toast({
        title: "Auto-refresh disabled",
        description: "Volume data will no longer refresh automatically"
      });
    } else {
      setAutoRefresh(30); // Default to 30 seconds
      toast({
        title: "Auto-refresh enabled",
        description: "Volume data will refresh every 30 seconds"
      });
    }
  };

  // Ensure volumes is an array before filtering
  const volumesArray = Array.isArray(volumes) ? volumes : [];
  
  const filteredVolumes = volumesArray.filter(volume => 
    volume.name?.toLowerCase().includes(search.toLowerCase()) ||
    volume.region?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Storage Volumes</h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Your Volumes</h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant={autoRefresh ? "secondary" : "outline"}
                size="sm" 
                onClick={toggleAutoRefresh}
              >
                {autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}
              </Button>
            </div>
          </div>
          <Input 
            placeholder="Search volumes by name or region..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="space-y-4 mt-6">
          {filteredVolumes.map((volume) => (
            <Card key={volume.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{volume.name}</CardTitle>
                    <CardDescription>
                      {volume.size}GB in {volume.region}
                    </CardDescription>
                  </div>
                  <Link href={`/servers/${volume.serverId}`}>
                    <Button variant="outline" size="sm">
                      View Server
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <VolumeManager serverId={volume.serverId} />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}