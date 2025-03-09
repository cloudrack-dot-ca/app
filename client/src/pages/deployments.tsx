import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, ExternalLink, RefreshCw, Terminal, Trash2, Settings, GitBranch, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";

interface GitHubDeployment {
  id: string;
  name: string;
  repository: string;
  branch: string;
  status: 'deploying' | 'active' | 'failed' | 'stopped';
  url: string;
  region: string;
  size: string;
  createdAt: string;
  lastDeployedAt: string;
  lastCommit?: string;
}

interface DeploymentLog {
  timestamp: string;
  message: string;
}

export default function DeploymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [selectedDeployment, setSelectedDeployment] = useState<GitHubDeployment | null>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: deployments = [], isLoading, refetch } = useQuery<GitHubDeployment[]>({
    queryKey: ["/api/github/deployments"],
    refetchInterval: 30000, // Refetch every 30 seconds to keep status updated
  });

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery<DeploymentLog[]>({
    queryKey: ["/api/github/deployments", selectedDeployment?.id, "logs"],
    enabled: !!selectedDeployment && isLogsOpen,
  });

  const handleRestart = async (deploymentId: string) => {
    try {
      await apiRequest("POST", `/api/github/deployments/${deploymentId}/restart`);
      toast({
        title: "Deployment is restarting",
        description: "The application will restart momentarily",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleRedeploy = async (deploymentId: string) => {
    try {
      await apiRequest("POST", `/api/github/deployments/${deploymentId}/redeploy`);
      toast({
        title: "Redeploy triggered",
        description: "Your application is being redeployed with the latest code",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (deploymentId: string) => {
    if (!confirm("Are you sure you want to delete this deployment? This action cannot be undone.")) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/github/deployments/${deploymentId}`);
      toast({
        title: "Deployment deleted",
        description: "Your application has been deleted",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const filteredDeployments = activeTab === "all"
    ? deployments
    : deployments.filter(d => d.status === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'deploying': return 'bg-blue-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      case 'stopped': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'deploying': return 'Deploying';
      case 'failed': return 'Failed';
      case 'stopped': return 'Stopped';
      default: return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">GitHub Deployments</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <Github className="h-4 w-4 mr-2" />
              Deploy New App
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="deploying">Deploying</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredDeployments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No deployments found</p>
                <p className="text-muted-foreground mb-6">
                  {activeTab === "all"
                    ? "You haven't deployed any GitHub applications yet."
                    : `No ${activeTab} deployments found.`}
                </p>
                <Button asChild>
                  <Link href="/dashboard">Deploy Your First App</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDeployments.map((deployment) => (
                <Card key={deployment.id} className="overflow-hidden">
                  <div className={`h-1 ${getStatusColor(deployment.status)}`} />
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {deployment.name}
                          <Badge variant="outline" className="ml-2">
                            {getStatusLabel(deployment.status)}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-1">
                            <Github className="h-3.5 w-3.5" />
                            {deployment.repository}
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Branch:</span>
                      <span className="font-medium flex items-center">
                        <GitBranch className="h-3.5 w-3.5 mr-1" /> {deployment.branch}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region:</span>
                      <span className="font-medium">{deployment.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last deployed:</span>
                      <span className="font-medium">
                        {format(new Date(deployment.lastDeployedAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>

                    {deployment.status === "failed" && (
                      <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-2 rounded-md flex items-start">
                        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                        <span className="text-xs">
                          Deployment failed. View logs for details.
                        </span>
                      </div>
                    )}

                    {deployment.url && deployment.status === "active" && (
                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <a href={deployment.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                            Visit Application
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2 justify-between">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestart(deployment.id)}
                        disabled={deployment.status === 'deploying'}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" /> Restart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDeployment(deployment);
                          setIsLogsOpen(true);
                        }}
                      >
                        <Terminal className="h-3.5 w-3.5 mr-1" /> Logs
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRedeploy(deployment.id)}
                        disabled={deployment.status === 'deploying'}
                      >
                        Redeploy
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(deployment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Logs Dialog */}
      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDeployment?.name} Logs
            </DialogTitle>
            <DialogDescription>
              Deployment logs for {selectedDeployment?.repository}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-[400px] overflow-y-auto">
            {isLoadingLogs ? (
              <div className="flex justify-center items-center h-full"></div>
                <RefreshCw className="h-5 w-5 animate-spin" />
              </div>
          ) : logs.length === 0 ? (
          <div className="text-center h-full flex items-center justify-center">
            <p>No logs available for this deployment</p>
          </div>
          ) : (
              logs.map((log, i) => (
          <p key={i} className="whitespace-pre-wrap">
            <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
          </p>
          ))
            )}
        </div>
      </DialogContent>
    </Dialog>
    </div >
  );
}
