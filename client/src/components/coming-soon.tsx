
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

  console.log('ComingSoon Component State:', {
    user,
    isAdmin: user?.isAdmin,
    comingSoonEnabled: maintenanceSettings?.comingSoonEnabled,
    currentPath,
    bypassPaths
  });

  // Admin check - ABSOLUTELY RETURN NULL if admin
  if (user && user.isAdmin === true) {
    console.log('ADMIN USER DETECTED - Returning NULL');
    return null;
  }

  // If coming soon mode is disabled, return null
  if (!maintenanceSettings?.comingSoonEnabled) {
    return null;
  }

  // Check if current path is in bypass list
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
      </div>
    </div>
  );
}

// HOC to wrap features that are coming soon
export function withComingSoon(Component: React.ComponentType, options: ComingSoonProps = {}) {
  return function ComingSoonWrapper(props: any) {
    const { user } = useAuth();
    
    // DIRECTLY CHECK FOR ADMIN WITHOUT ANY OTHER LOGIC
    if (user && user.isAdmin === true) {
      console.log('withComingSoon HOC: Admin user detected, showing component');
      return <Component {...props} />;
    }

    // Render the ComingSoon component that handles all other checks
    const comingSoon = <ComingSoon {...options} />;

    // If ComingSoon returns null, show the actual component
    if (comingSoon === null) {
      return <Component {...props} />;
    }

    // Otherwise show the coming soon page
    return comingSoon;
  };
}
