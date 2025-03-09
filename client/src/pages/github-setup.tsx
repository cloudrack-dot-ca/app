import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Check, AlertCircle, Terminal, Globe, Server } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function GitHubSetupPage() {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);

  // Check if GitHub is already connected
  const { data: repos = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/github/repos"],
    retry: false,
  });

  const isConnected = repos.length > 0;

  // Handle connect button click
  const handleConnect = async () => {
    try {
      setConnecting(true);
      // Make API call to get the GitHub OAuth URL
      const response = await fetch("/api/github/auth-url");

      if (!response.ok) {
        throw new Error(`Failed to get GitHub authorization URL: ${response.status}`);
      }

      // Get the URL from the response JSON
      const data = await response.json();

      if (data && data.url) {
        // Redirect to the GitHub OAuth page
        window.location.href = data.url;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: (error as Error).message || "GitHub integration is unavailable",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">GitHub Integration Setup</h1>
      <p className="text-muted-foreground mb-8">
        Connect your GitHub account to deploy applications directly from your repositories
      </p>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>How to Connect Your GitHub Account</CardTitle>
              <CardDescription>Follow these steps to link your GitHub account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    1
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Click the Connect GitHub Button</h3>
                    <p className="text-muted-foreground">
                      Click the "Connect GitHub" button in the sidebar or on this page to start the connection process.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    2
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Authorize the Application</h3>
                    <p className="text-muted-foreground">
                      You'll be redirected to GitHub where you need to authorize our application to access your repositories.
                      We only request the permissions needed to deploy your code.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    3
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Select Repositories to Deploy</h3>
                    <p className="text-muted-foreground">
                      Once connected, you can select which repositories you want to deploy. We support various types of applications
                      including Node.js, Python, Ruby, PHP, and static websites.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    4
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Configure Deployment Settings</h3>
                    <p className="text-muted-foreground">
                      Choose your server specifications, deployment settings, and environment variables.
                      We'll automatically detect your application type and configure the server accordingly.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {isConnected ? (
                <div className="flex items-center text-green-600 dark:text-green-500">
                  <Check className="h-5 w-5 mr-2" />
                  <p>GitHub Account Connected Successfully!</p>
                </div>
              ) : (
                <Button onClick={handleConnect} disabled={connecting} className="bg-[#24292e] hover:bg-[#1b1f23]">
                  <Github className="h-4 w-4 mr-2" />
                  {connecting ? "Connecting..." : "Connect GitHub Account"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>GitHub Account</span>
                  {isLoading ? (
                    <span className="text-sm text-muted-foreground">Checking...</span>
                  ) : isConnected ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      <Check className="h-3 w-3 mr-1" /> Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                      <AlertCircle className="h-3 w-3 mr-1" /> Not Connected
                    </span>
                  )}
                </div>
                {isConnected && (
                  <div className="flex items-center justify-between">
                    <span>Available Repositories</span>
                    <span className="font-medium">{repos.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Application Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Terminal className="h-4 w-4 mr-2 text-primary" />
                  <span>Node.js Applications</span>
                </li>
                <li className="flex items-center">
                  <Terminal className="h-4 w-4 mr-2 text-primary" />
                  <span>Python Applications</span>
                </li>
                <li className="flex items-center">
                  <Terminal className="h-4 w-4 mr-2 text-primary" />
                  <span>PHP Applications</span>
                </li>
                <li className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-primary" />
                  <span>Static Websites</span>
                </li>
                <li className="flex items-center">
                  <Server className="h-4 w-4 mr-2 text-primary" />
                  <span>Docker Containers</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard">
                  <Server className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/account#github">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub Settings
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="https://docs.github.com/en/apps/oauth-apps" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub OAuth Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
