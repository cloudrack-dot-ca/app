import { useQuery } from "@tanstack/react-query";
import { Volume } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVolumeSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

// Map regions to flag emojis
const regionFlags: { [key: string]: string } = {
  'nyc1': '🇺🇸 New York',
  'sfo1': '🇺🇸 San Francisco',
  'ams1': '🇳🇱 Amsterdam',
  'sgp1': '🇸🇬 Singapore',
  'lon1': '🇬🇧 London',
  'fra1': '🇩🇪 Frankfurt',
  'tor1': '🇨🇦 Toronto',
  'blr1': '🇮🇳 Bangalore',
};

interface VolumeManagerProps {
  serverId: number;
}

export default function VolumeManager({ serverId }: VolumeManagerProps) {
  const { toast } = useToast();
  const [resizingVolume, setResizingVolume] = useState<Volume | null>(null);
  const [newSize, setNewSize] = useState<number>(0);

  const { data: volumes = [], isLoading } = useQuery<Volume[]>({
    queryKey: [`/api/servers/${serverId}/volumes`],
  });

  const { data: server } = useQuery({
    queryKey: [`/api/servers/${serverId}`],
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

  async function onDeleteVolume(volumeId: number) {
    try {
      await apiRequest("DELETE", `/api/servers/${serverId}/volumes/${volumeId}`);
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/volumes`] });
      toast({
        title: "Volume deleted",
        description: "Your volume has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  async function onResizeVolume(volumeId: number, newSize: number) {
    try {
      await apiRequest("PATCH", `/api/servers/${serverId}/volumes/${volumeId}`, { size: newSize });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/volumes`] });
      setResizingVolume(null);
      toast({
        title: "Volume resized",
        description: "Your volume is being resized",
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
            <div className="space-y-2 flex-1">
              <h4 className="font-medium">{volume.name}</h4>
              <p className="text-sm text-muted-foreground">
                {volume.size}GB in {regionFlags[volume.region] || volume.region}
              </p>
              <p className="text-sm text-muted-foreground">
                Cost: ${(volume.size * 0.00014).toFixed(5)}/hour
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setResizingVolume(volume);
                  setNewSize(volume.size);
                }}
              >
                Resize
              </Button>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Volume</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this volume? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteVolume(volume.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        {volumes.length === 0 && (
          <p className="text-center text-muted-foreground">No volumes attached</p>
        )}
      </div>

      {resizingVolume && (
        <Dialog open={!!resizingVolume} onOpenChange={() => setResizingVolume(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resize Volume</DialogTitle>
              <DialogDescription>
                Adjust the volume size. You can only increase the size, not decrease it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Slider
                  value={[newSize]}
                  min={resizingVolume.size}
                  max={resizingVolume.size + 1000}
                  step={10}
                  onValueChange={(value) => setNewSize(value[0])}
                />
                <Input
                  type="number"
                  value={newSize}
                  min={resizingVolume.size}
                  step={10}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= resizingVolume.size) {
                      setNewSize(value);
                    }
                  }}
                  className="w-24"
                />
                <span>GB</span>
              </div>
              <p className="text-sm text-muted-foreground">
                New cost: ${(newSize * 0.00014).toFixed(5)}/hour
              </p>
              <p className="text-sm text-muted-foreground">
                Difference: +${((newSize - resizingVolume.size) * 0.00014).toFixed(5)}/hour
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResizingVolume(null)}>
                  Cancel
                </Button>
                <Button onClick={() => onResizeVolume(resizingVolume.id, newSize)}>
                  Resize Volume
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="10"
                        step="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                      <span>GB</span>
                    </div>
                  </FormControl>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cost: ${(field.value * 0.00014).toFixed(5)}/hour
                  </p>
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