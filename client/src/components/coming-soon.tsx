
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComingSoonProps {
  featureName?: string;
  customMessage?: string;
  redirectPath?: string;
}

export function ComingSoon({ featureName = 'This feature', customMessage, redirectPath = '/dashboard' }: ComingSoonProps) {
  const { user } = useAuth();
  
  // Get maintenance settings
  const { data: maintenanceSettings } = useQuery({
    queryKey: ['/api/maintenance'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/maintenance');
        if (!response.ok) return undefined;
        return response.json();
      } catch (error) {
        return undefined;
      }
    }
  });
  
  // If user is admin or coming soon mode is disabled, return null to render the actual feature
  if ((user?.isAdmin) || !maintenanceSettings?.comingSoonEnabled) {
    return null;
  }
  
  const message = customMessage || maintenanceSettings?.comingSoonMessage || `${featureName} is coming soon. Stay tuned for updates!`;
  
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-xl">Coming Soon</CardTitle>
          <CardDescription>
            This feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{message}</p>
          <Link href={redirectPath}>
            <Button className="w-full">Return to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// HOC to wrap features that are coming soon
export function withComingSoon(Component: React.ComponentType, options: ComingSoonProps = {}) {
  return function ComingSoonWrapper(props: any) {
    const comingSoon = <ComingSoon {...options} />;
    if (comingSoon === null) {
      return <Component {...props} />;
    }
    return comingSoon;
  };
}
