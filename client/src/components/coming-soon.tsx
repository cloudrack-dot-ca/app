import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComingSoonProps {
  featureName?: string;
  customMessage?: string;
  redirectPath?: string;
  bypassPaths?: string[];
}

export function ComingSoon({ 
  featureName = 'This feature', 
  customMessage, 
  redirectPath = '/dashboard',
  bypassPaths = ['/auth', '/logout']
}: ComingSoonProps) {
  const { user } = useAuth();
  const currentPath = window.location.pathname;

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

  // If user is admin, coming soon mode is disabled, or current path is in bypass list, return null
  if (
    (user?.isAdmin) || 
    !maintenanceSettings?.comingSoonEnabled ||
    bypassPaths.includes(currentPath)
  ) {
    return null;
  }

  const message = customMessage || maintenanceSettings?.comingSoonMessage || `${featureName} is coming soon. Stay tuned for updates!`;

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
          <div className="flex flex-col gap-2">
            <Link href={redirectPath}>
              <Button className="w-full">Return to Dashboard</Button>
            </Link>
            {user ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLogout}
              >
                Logout
              </Button>
            ) : (
              <Link href="/auth">
                <Button 
                  variant="outline" 
                  className="w-full"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
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