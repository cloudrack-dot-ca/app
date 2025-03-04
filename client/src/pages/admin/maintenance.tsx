import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { updateSiteSettingsSchema } from "@shared/schema";
import type { UpdateSiteSettings } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function MaintenanceSettings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const form = useForm<UpdateSiteSettings>({
    resolver: zodResolver(updateSiteSettingsSchema),
    defaultValues: settings || {
      maintenanceMode: false,
      maintenanceMessage: "We're currently performing maintenance. Please check back soon.",
      comingSoonMode: false,
      comingSoonMessage: "This feature is coming soon. Stay tuned for updates!"
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: UpdateSiteSettings) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: UpdateSiteSettings) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Maintenance Mode Settings</h1>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Maintenance Mode</FormLabel>
                      <FormDescription>
                        Enable to show maintenance page to non-admin users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenanceMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter the message to show during maintenance"
                      />
                    </FormControl>
                    <FormDescription>
                      This message will be shown to logged-out users and normal users
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comingSoonMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Coming Soon Mode</FormLabel>
                      <FormDescription>
                        Enable to show coming soon page for features under development
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comingSoonMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coming Soon Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter the message to show for upcoming features"
                      />
                    </FormControl>
                    <FormDescription>
                      This message will be shown on pages under development
                    </FormDescription>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full sm:w-auto"
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
