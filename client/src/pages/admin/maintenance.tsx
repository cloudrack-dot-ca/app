
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heading } from '@/components/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/maintenance'],
    queryFn: async () => {
      const response = await fetch('/api/admin/maintenance');
      if (!response.ok) throw new Error('Failed to fetch maintenance settings');
      return response.json();
    }
  });
  
  const [localSettings, setLocalSettings] = useState({
    enabled: false,
    maintenanceMessage: "We're currently performing maintenance. Please check back soon.",
    comingSoonEnabled: false,
    comingSoonMessage: "This feature is coming soon. Stay tuned for updates!"
  });
  
  // Update local state when data is loaded
  React.useEffect(() => {
    if (settings) {
      setLocalSettings({
        enabled: settings.enabled || false,
        maintenanceMessage: settings.maintenanceMessage || "We're currently performing maintenance. Please check back soon.",
        comingSoonEnabled: settings.comingSoonEnabled || false,
        comingSoonMessage: settings.comingSoonMessage || "This feature is coming soon. Stay tuned for updates!"
      });
    }
  }, [settings]);
  
  const handleMaintenanceToggle = (checked: boolean) => {
    // If enabling maintenance mode, disable coming soon mode
    if (checked) {
      setLocalSettings({
        ...localSettings,
        enabled: checked,
        comingSoonEnabled: false
      });
    } else {
      setLocalSettings({
        ...localSettings,
        enabled: checked
      });
    }
  };

  const handleComingSoonToggle = (checked: boolean) => {
    // If enabling coming soon mode, disable maintenance mode
    if (checked) {
      setLocalSettings({
        ...localSettings,
        comingSoonEnabled: checked,
        enabled: false
      });
    } else {
      setLocalSettings({
        ...localSettings,
        comingSoonEnabled: checked
      });
    }
  };
  
  const mutation = useMutation({
    mutationFn: async (data: typeof localSettings) => {
      const response = await fetch('/api/admin/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update maintenance settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      toast.success('Maintenance settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update maintenance settings: ' + (error as Error).message);
    }
  });
  
  const handleSave = () => {
    mutation.mutate(localSettings);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Heading title="Maintenance Mode Settings" description="Configure maintenance mode and customize messages shown to users" />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Enable to show maintenance page to non-admin users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Maintenance mode and Coming Soon mode cannot be enabled at the same time.
              Enabling one will automatically disable the other.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
            <Switch 
              id="maintenance-mode" 
              checked={localSettings.enabled}
              onCheckedChange={handleMaintenanceToggle}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea 
              id="maintenance-message" 
              rows={4}
              value={localSettings.maintenanceMessage}
              onChange={(e) => setLocalSettings({...localSettings, maintenanceMessage: e.target.value})}
              placeholder="Enter message to show during maintenance"
            />
            <p className="text-sm text-muted-foreground">
              This message will be shown to logged-out users and normal users
            </p>
          </div>
          
          <div className="border-t pt-6">
            <CardTitle className="mb-2">Coming Soon Mode</CardTitle>
            <CardDescription className="mb-4">
              Enable to show coming soon page for features under development
            </CardDescription>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="coming-soon-mode">Coming Soon Mode</Label>
              <Switch 
                id="coming-soon-mode" 
                checked={localSettings.comingSoonEnabled}
                onCheckedChange={handleComingSoonToggle}
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="coming-soon-message">Coming Soon Message</Label>
              <Textarea 
                id="coming-soon-message" 
                rows={4}
                value={localSettings.comingSoonMessage}
                onChange={(e) => setLocalSettings({...localSettings, comingSoonMessage: e.target.value})}
                placeholder="Enter message to show for features under development"
              />
              <p className="text-sm text-muted-foreground">
                This message will be shown on pages under development
              </p>
            </div>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
