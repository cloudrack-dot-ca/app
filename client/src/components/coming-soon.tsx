
import React from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

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

  // Force component re-render when user changes
  const [key, setKey] = React.useState(0);
  React.useEffect(() => {
    if (user) {
      setKey(prev => prev + 1);
    }
  }, [user]);

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

  // Log the current state for debugging
  console.log('ComingSoon Component State:', {
    user,
    isAdmin: user?.isAdmin,
    comingSoonEnabled: maintenanceSettings?.comingSoonEnabled,
    currentPath,
    bypassPaths
  });

  // Check if user is admin FIRST before other conditions
  if (user?.isAdmin === true) {
    console.log('ComingSoon: Admin detected, bypassing coming soon page');
    return null;
  }

  // If coming soon mode is disabled or current path is in bypass list, return null
  if (
    !maintenanceSettings?.comingSoonEnabled ||
    bypassPaths.some(path => currentPath.startsWith(path))
  ) {
    console.log('ComingSoon: Bypassing coming soon page - disabled or bypass path');
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
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-xl">Coming Soon</CardTitle>
          <CardDescription>
            This feature is under development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>
          <div className="flex flex-col gap-2 mt-4">
            {user ? (
              <>
                <Link to={redirectPath}>
                  <Button className="w-full" variant="default">
                    Return to Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth">
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
    const { user } = useAuth();
    const currentPath = window.location.pathname;
    
    // Get maintenance settings directly in HOC for more reliable checking
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
    
    // Log the current state for debugging
    console.log('withComingSoon HOC State:', {
      user,
      isAdmin: user?.isAdmin,
      comingSoonEnabled: maintenanceSettings?.comingSoonEnabled,
      currentPath,
      bypassPaths: options.bypassPaths || ['/auth', '/logout']
    });
    
    // Early direct check for admin users - this is the most important condition
    if (user?.isAdmin === true) {
      console.log('withComingSoon: Admin user detected, showing component');
      return <Component {...props} />;
    }
    
    // Direct check for bypass paths
    const bypassPaths = options.bypassPaths || ['/auth', '/logout'];
    if (bypassPaths.some(path => currentPath.startsWith(path))) {
      console.log('withComingSoon: Path in bypass list, showing component');
      return <Component {...props} />;
    }
    
    // Check for coming soon mode
    if (!maintenanceSettings?.comingSoonEnabled) {
      console.log('withComingSoon: Coming soon mode disabled, showing component');
      return <Component {...props} />;
    }
    
    // If we get here, show the coming soon page
    console.log('withComingSoon: Showing coming soon page');
    return <ComingSoon {...options} />;
  };
}
