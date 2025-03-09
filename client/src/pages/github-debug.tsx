import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { InfoIcon, Github, AlertTriangle, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export default function GitHubDebugPage() {
  const { user } = useAuth();
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const { data: githubConnectionDetails } = useQuery({
    queryKey: ["/api/github/connection-details"],
    queryFn: async () => {
      try {
        return await apiRequest("GET", "/api/github/connection-details");
      } catch (error) {
        return { connected: false, error: (error as Error).message };
      }
    }
  });

  const { data: githubRepos = [] } = useQuery({
    queryKey: ["/api/github/repos"],
  });

  const addDebugMessage = (message: string) => {
    setDebugMessages(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const getAuthUrl = async () => {
    try {
      addDebugMessage("Requesting GitHub authorization URL...");
      const response = await apiRequest("GET", "/api/github/auth-url");

      if (response && response.url) {
        setRedirectUrl(response.url);
        addDebugMessage(`Retrieved auth URL: ${response.url}`);

        // Parse URL parts
        const clientId = new URL(response.url).searchParams.get("client_id");
        const redirectUri = new URL(response.url).searchParams.get("redirect_uri");

        addDebugMessage(`Client ID: ${clientId}`);
        addDebugMessage(`Redirect URI: ${decodeURIComponent(redirectUri || "")}`);
      } else {
        addDebugMessage("Failed to get URL from response");
      }
    } catch (error) {
      addDebugMessage(`Error: ${(error as Error).message}`);
    }
  };

  const connectWithGitHub = () => {
    if (redirectUrl) {
      addDebugMessage(`Redirecting to GitHub: ${redirectUrl}`);
      window.location.href = redirectUrl;
    } else {
      addDebugMessage("No redirect URL available");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">GitHub Integration Debug</h1>
      </div>

      <Alert variant="default" className="bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Debug Tools</AlertTitle>
        <AlertDescription>
          These tools help diagnose GitHub integration issues. Use the debug console to see detailed connection information.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">Connection Status</TabsTrigger>
          <TabsTrigger value="debug">Debug Console</TabsTrigger>
          <TabsTrigger value="repos">Repositories</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Connection Status
              </CardTitle>
              <CardDescription>
                Details about your GitHub connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span>Connection Status:</span>
                  {githubConnectionDetails?.connected ? (
                    <Badge className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Not Connected
                    </Badge>
                  )}
                </div>

                {githubConnectionDetails?.username && (
                  <div>
                    <span>GitHub Username: </span>
                    <span className="font-medium">{githubConnectionDetails.username}</span>
                  </div>
                )}

                {githubConnectionDetails?.token && (
                  <div>
                    <span>Token Status: </span>
                    <Badge>Valid</Badge>
                  </div>
                )}

                {githubConnectionDetails?.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{githubConnectionDetails.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={getAuthUrl}>Get Auth URL</Button>
              <Button
                onClick={connectWithGitHub}
                disabled={!redirectUrl}
                variant="outline"
              >
                <Github className="h-4 w-4 mr-2" />
                Connect with GitHub
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug Console</CardTitle>
              <CardDescription>
                Real-time connection debugging information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-black text-green-500 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
                {debugMessages.length === 0 ?
                  "No debug messages. Click 'Get Auth URL' to start debugging." :
                  debugMessages.map((msg, i) => <div key={i}>{msg}</div>)
                }
              </pre>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => setDebugMessages([])}
                variant="outline"
              >
                Clear Console
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="repos">
          <Card>
            <CardHeader>
              <CardTitle>Available GitHub Repositories</CardTitle>
              <CardDescription>
                Repositories that can be deployed from your GitHub account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {githubRepos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No repositories found. You may need to connect your GitHub account first.
                </div>
              ) : (
                <div className="space-y-2">
                  {githubRepos.map((repo: any) => (
                    <div key={repo.id} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{repo.full_name}</div>
                        {repo.private && <Badge>Private</Badge>}
                      </div>
                      {repo.description && (
                        <div className="text-sm text-muted-foreground mt-1">{repo.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
