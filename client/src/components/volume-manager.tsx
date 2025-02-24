import { useQuery } from "@tanstack/react-query";
import { Volume } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVolumeSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VolumeManagerProps {
  serverId: number;
}

export default function VolumeManager({ serverId }: VolumeManagerProps) {
  const { toast } = useToast();
  const { data: volumes = [], isLoading } = useQuery<Volume[]>({
    queryKey: [`/api/servers/${serverId}/volumes`],
  });

  const form = useForm({
    resolver: zodResolver(insertVolumeSchema),
    defaultValues: {
      name: "",
      size: 10,
    },
  });

  async function onSubmit(values: any) {
    try {
      await apiRequest("POST", `/api/servers/${serverId}/volumes`, values);
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/volumes`] });
      form.reset();
      toast({
        title: "Volume created",
        description: "Your new volume is being provisioned",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {volumes.map((volume) => (
          <div
            key={volume.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h4 className="font-medium">{volume.name}</h4>
              <p className="text-sm text-muted-foreground">{volume.size}GB</p>
            </div>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {volumes.length === 0 && (
          <p className="text-center text-muted-foreground">No volumes attached</p>
        )}
      </div>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-4">Add New Volume</h4>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size (GB)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="10"
                      step="10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Volume"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
