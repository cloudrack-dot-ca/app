import { Server } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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

  const specs = server.specs || { memory: 0, vcpus: 0, disk: 0 };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{server.name}</CardTitle>
        <Badge
          variant={server.status === "active" ? "default" : "secondary"}
          className="mt-2 sm:mt-0"
        >
          {server.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Memory</span>
                <span>{specs.memory / 1024}GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">vCPUs</span>
                <span>{specs.vcpus}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span>{specs.disk}GB</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-mono">{server.ipAddress}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Region</span>
                <span>{server.region}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Dialog open={volumeOpen} onOpenChange={setVolumeOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Volumes
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Manage Volumes</DialogTitle>
                </DialogHeader>
                <VolumeManager serverId={server.id} />
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Server</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this server? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteServer}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}