import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface MaintenanceSettings {
  enabled: boolean;
  maintenanceMessage: string;
  comingSoonMessage: string;
}

export default function MaintenanceSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current maintenance settings
  const { data: settings, isLoading } = useQuery<MaintenanceSettings>({
    queryKey: ['/api/admin/maintenance'],
  });

  // Update maintenance settings
  const updateSettings = useMutation({
    mutationFn: async (newSettings: MaintenanceSettings) => {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update maintenance settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/maintenance'] });
      toast({
        title: "Settings Updated",
        description: "Maintenance mode settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update maintenance settings.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    updateSettings.mutate(settings);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode Settings</CardTitle>
          <CardDescription>
            Configure maintenance mode and customize messages shown to users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable to show maintenance page to non-admin users
              </p>
            </div>
            <Switch
              checked={settings?.enabled}
              onCheckedChange={(checked) => {
                if (settings) {
                  updateSettings.mutate({ ...settings, enabled: checked });
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea
              id="maintenance-message"
              placeholder="Enter the message to show during maintenance..."
              value={settings?.maintenanceMessage}
              onChange={(e) => {
                if (settings) {
                  updateSettings.mutate({
                    ...settings,
                    maintenanceMessage: e.target.value,
                  });
                }
              }}
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              This message will be shown to logged-out users and normal users
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coming-soon-message">Coming Soon Message</Label>
            <Textarea
              id="coming-soon-message"
              placeholder="Enter the coming soon message..."
              value={settings?.comingSoonMessage}
              onChange={(e) => {
                if (settings) {
                  updateSettings.mutate({
                    ...settings,
                    comingSoonMessage: e.target.value,
                  });
                }
              }}
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              This message will be shown on pages under development
            </p>
          </div>

          <Button type="submit" disabled={updateSettings.isPending}>
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
