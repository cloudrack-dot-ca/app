import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Server } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ServerCard from "@/components/server-card";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServerSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search, LockKeyhole, Key, Server as ServerIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import * as z from 'zod';

interface Region {
  slug: string;
  name: string;
}

interface Size {
  slug: string;
  memory: number;
  vcpus: number;
  price_monthly: number;
  processor_type?: 'regular' | 'intel' | 'amd';
}

interface Application {
  slug: string;
  name: string;
  description: string;
  type: string;
}

interface Distribution {
  slug: string;
  name: string;
  description: string;
}

interface SSHKey {
  id: number;
  name: string;
  publicKey: string;
  createdAt: string;
}

function calculatePasswordStrength(password: string): number {
  if (!password) return 0;
  let strength = 0;
  if (password.match(/[a-z]/)) strength += 20;
  if (password.match(/[A-Z]/)) strength += 20;
  if (password.match(/[0-9]/)) strength += 20;
  if (password.match(/[^a-zA-Z0-9]/)) strength += 20;
  if (password.length >= 8) strength += 20;
  // Penalize if ends with special character
  if (password.match(/[^a-zA-Z0-9]$/)) strength = Math.max(0, strength - 20);
  return strength;
}

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [authType, setAuthType] = useState<"password" | "ssh">("password");
  const [sshKey, setSshKey] = useState("");
  const [selectedSSHKeyId, setSelectedSSHKeyId] = useState<number | string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [processorFilter, setProcessorFilter] = useState<string>("all");
  const [applicationTypeFilter, setApplicationTypeFilter] = useState<string>("all");

  const { data: servers = [], isLoading } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
  });

  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: sizes = [] } = useQuery<Size[]>({
    queryKey: ["/api/sizes"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: distributions = [] } = useQuery<Distribution[]>({
    queryKey: ["/api/distributions"],
  });

  const { data: sshKeys = [] } = useQuery<SSHKey[]>({
    queryKey: ["/api/ssh-keys"],
  });

  const form = useForm({
    resolver: zodResolver(
      insertServerSchema.extend({
        auth: insertServerSchema.shape.name.refine(
          (value: string) => {
            if (authType === "password") {
              return value && value.length >= 8 && !value.match(/[^a-zA-Z0-9]$/);
            }
            return true;
          },
          "Password must be at least 8 characters and not end with a special character"
        ),
        application: z.string().optional(),
      })
    ),
    defaultValues: {
      name: "",
      region: "",
      size: "",
      auth: "",
      application: "",
    },
  });

  const filteredServers = servers.filter((server: Server) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(searchLower) ||
      (server.ipAddress && server.ipAddress.includes(searchQuery))
    );
  });

  const password = form.watch("auth");
  const passwordStrength = calculatePasswordStrength(password);

  async function onSubmit(values: z.infer<typeof insertServerSchema>) {
    try {
      // If adding a new SSH key, save it first
      let sshKeyToUse = selectedSSHKeyId && typeof selectedSSHKeyId === "number" 
        ? sshKeys.find(key => key.id === selectedSSHKeyId)?.publicKey 
        : undefined;

      if (authType === "ssh" && sshKey && !selectedSSHKeyId) {
        if (!newKeyName) {
          toast({
            title: "Error",
            description: "Please provide a name for your SSH key",
            variant: "destructive",
          });
          return;
        }

        try {
          const response = await apiRequest("POST", "/api/ssh-keys", {
            name: newKeyName,
            publicKey: sshKey,
          });
          sshKeyToUse = (response as any).publicKey;
          queryClient.invalidateQueries({ queryKey: ["/api/ssh-keys"] });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to save SSH key: " + (error as Error).message,
            variant: "destructive",
          });
          return;
        }
      }

      const serverData = {
        name: values.name,
        region: values.region,
        size: values.size,
        application: values.application,
        auth: {
          type: authType,
          value: authType === "password" ? values.auth : sshKeyToUse || sshKey
        }
      };

      await apiRequest("POST", "/api/servers", serverData);
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      setCreateOpen(false);
      form.reset();
      setNewKeyName("");
      setSshKey("");
      setSelectedSSHKeyId(null);
      toast({
        title: "Server created",
        description: "Your new server is being provisioned",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/billing">Billing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/support">Support</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {user?.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    Edit Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ssh-keys">
                    SSH Keys
                  </Link>
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-3xl font-bold">Your Servers</h2>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Server
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Server</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Server Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-9" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Region</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {regions.map((region) => (
                                  <SelectItem key={region.slug} value={region.slug}>
                                    {region.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-sm">Size</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sizes
                                  .filter(size => processorFilter === "all" ? true : (size.processor_type || 'regular') === processorFilter)
                                  .map((size) => (
                                    <SelectItem key={size.slug} value={size.slug}>
                                      {size.processor_type === 'intel' && '🔷 '}
                                      {size.processor_type === 'amd' && '🔶 '}
                                      {size.memory / 1024}GB RAM, {size.vcpus} vCPUs (${(size.price_monthly / (24 * 30)).toFixed(3)}/hr)
                                    </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="auth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Authentication Method</FormLabel>
                          <RadioGroup value={authType} onValueChange={setAuthType}>
                            <RadioGroupItem value="password">
                              <Label>Password</Label>
                              <Input type="password" {...field} className="mt-2 h-9" />
                              <div className="mt-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs">Password Strength</span>
                                  <span className="text-xs">{passwordStrength}%</span>
                                </div>
                                <Progress value={passwordStrength} className="h-1.5" />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                This password will be used to access your server via the web terminal.
                              </div>
                            </RadioGroupItem>
                            <RadioGroupItem value="ssh">
                              <Label>SSH Key</Label>
                              <div className="flex flex-col">
                                <Select
                                  onValueChange={setSelectedSSHKeyId}
                                  value={selectedSSHKeyId}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select SSH Key" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {sshKeys.map((key) => (
                                      <SelectItem key={key.id} value={key.id}>
                                        {key.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Textarea
                                  placeholder="Paste your SSH public key here"
                                  className="mt-2 h-24"
                                  value={sshKey}
                                  onChange={(e) => setSshKey(e.target.value)}
                                />
                                <Input
                                  type="text"
                                  placeholder="Enter a name for this key (optional)"
                                  className="mt-2 h-9"
                                  value={newKeyName}
                                  onChange={(e) => setNewKeyName(e.target.value)}
                                />
                              </div>
                              <FormMessage className="text-xs" />
                            </RadioGroupItem>
                          </RadioGroup>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <div className="pt-2">
                      <Button type="submit" className="w-full h-9 text-sm" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <ServerIcon className="h-3 w-3 mr-2" />
                        )}
                        Create Server
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search servers by name or IP address..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredServers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No servers found matching your search"
                  : "No servers yet. Create your first server to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredServers.map((server: Server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}