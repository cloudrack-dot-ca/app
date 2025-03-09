import GitHubDebug from "@/components/github-debug";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function GitHubDebugPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GitHub Debug Tools</CardTitle>
          <CardDescription>
            Use these tools to debug and test your GitHub integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GitHubDebug />
        </CardContent>
      </Card>
    </div>
  );
}
