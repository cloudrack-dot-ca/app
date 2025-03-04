
import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

  // Skip everything if the user is admin
  if (user && user.isAdmin === true) {
    console.log('ADMIN USER - SKIPPING COMING SOON CHECK ENTIRELY', user);
    return null;
  }

  // If coming soon mode is disabled, don't show the message
  if (!maintenanceSettings?.comingSoonEnabled) {
    return null;
  }

  // Allow access to auth pages for everyone
  if (bypassPaths.some(path => currentPath.startsWith(path))) {
    return null;
  }

  // If we reach here, show the coming soon page
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-full bg-primary p-2 text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold">Coming Soon</h3>
        </div>
        <p className="mb-4 text-muted-foreground">
          {customMessage || maintenanceSettings?.comingSoonMessage || 
            `${featureName} is coming soon. Stay tuned for updates!`}
        </p>
        <div className="flex justify-end">
          <Button asChild>
            <Link to={redirectPath}>Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// HOC to wrap features that are coming soon
export function withComingSoon(Component: React.ComponentType, options: ComingSoonProps = {}) {
  return function ComingSoonWrapper(props: any) {
    const { user } = useAuth();
    
    // If user is admin, directly render the component without any checks
    if (user && user.isAdmin === true) {
      console.log("Admin user bypassing coming soon check:", user);
      return <Component {...props} />;
    }
    
    // For non-admin users, first check if component should be shown
    // then render coming soon component as a sibling that will overlay if needed
    return (
      <>
        <Component {...props} />
        <ComingSoon {...options} />
      </>
    );
  };
}
