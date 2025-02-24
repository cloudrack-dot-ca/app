import { Server } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import VolumeManager from "./volume-manager";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServerCardProps {
  server: Server;
}

export default function ServerCard({ server }: ServerCardProps) {
  const [volumeOpen, setVolumeOpen] = useState(false);
  const { toast } = useToast();

  async function deleteServer() {
    try {
      await apiRequest("DELETE", `/api/servers/${server.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      toast({
        title: "Server deleted",
        description: "Your server has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{server.name}</CardTitle>
        <Badge
          variant={server.status === "active" ? "default" : "secondary"}
        >
          {server.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Memory</span>
              <span>{server.specs.memory / 1024}GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">vCPUs</span>
              <span>{server.specs.vcpus}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage</span>
              <span>{server.specs.disk}GB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IP Address</span>
              <span>{server.ipAddress}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Region</span>
              <span>{server.region}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Dialog open={volumeOpen} onOpenChange={setVolumeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Volumes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Volumes</DialogTitle>
                </DialogHeader>
                <VolumeManager serverId={server.id} />
              </DialogContent>
            </Dialog>
            <Button variant="destructive" onClick={deleteServer}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
