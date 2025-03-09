import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function GitHubDebug() {
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthUrl = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/github/auth-url");
      if (response && response.url) {
        setDebugInfo(`
OAuth URL: ${response.url}

Client ID: ${response.url.match(/client_id=([^&]+)/)?.[1] || "Not found"}
Redirect URI: ${decodeURIComponent(response.url.match(/redirect_uri=([^&]+)/)?.[1] || "Not found")}
        `);
      }
    } catch (error) {
      setDebugInfo(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectAuth = () => {
    // Manual OAuth URL with definitely correct client ID
    const manualAuthUrl = "https://github.com/login/oauth/authorize" +
      `?client_id=Ov23lis2zEGGv7CCm9SG` +
      `&redirect_uri=${encodeURIComponent("http://localhost:5000/api/github/callback")}` +
      `&scope=repo` +
      `&state=${Math.random().toString(36).substring(7)}`;

    window.location.href = manualAuthUrl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub OAuth Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button onClick={getAuthUrl} disabled={isLoading}>
            {isLoading ? "Loading..." : "Check OAuth URL"}
          </Button>

          <Button onClick={handleDirectAuth} variant="secondary">
            Direct GitHub Auth (Bypass Server)
          </Button>
        </div>

        {debugInfo && (
          <pre className="p-4 bg-muted rounded-md text-xs whitespace-pre-wrap">
            {debugInfo}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
