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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Search, LockKeyhole, Server as ServerIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  distribution?: string; // References a distribution slug
}

interface Distribution {
  slug: string;
  name: string;
  description: string;
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
  const [processorFilter, setProcessorFilter] = useState<string>("all");
  const [applicationTypeFilter, setApplicationTypeFilter] = useState<string>("all");
  const [installMode, setInstallMode] = useState<"application" | "distribution">("application");
  
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

  const form = useForm({
    resolver: zodResolver(
      insertServerSchema.extend({
        name: z.string()
          .min(3, "Server name must be at least 3 characters")
          .max(63, "Server name must be 63 characters or less")
          .refine(
            (value) => /^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/i.test(value),
            "Server name must be a valid hostname (only letters, numbers, hyphens, and periods allowed. Cannot start or end with hyphens or periods)"
          ),
        auth: insertServerSchema.shape.name.refine(
          (value) => {
            return value && value.length >= 8 && !value.match(/[^a-zA-Z0-9]$/);
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

  const filteredServers = servers.filter((server) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      server.name.toLowerCase().includes(searchLower) ||
      (server.ipAddress && server.ipAddress.includes(searchQuery))
    );
  });

  const password = form.watch("auth");
  const passwordStrength = calculatePasswordStrength(password);

  async function onSubmit(values: any) {
    try {
      const serverData = {
        name: values.name,
        region: values.region,
        size: values.size,
        application: values.application,
        auth: {
          type: "password",
          value: values.auth
        }
      };

      await apiRequest("POST", "/api/servers", serverData);
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      setCreateOpen(false);
      form.reset();
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
                            <Input {...field} className="h-9" placeholder="e.g., my-server" />
                          </FormControl>
                          <FormMessage className="text-xs" />
                          <p className="text-xs text-muted-foreground">
                            Only letters, numbers, hyphens (-) and periods (.) allowed. Must start and end with a letter or number.
                          </p>
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
                    <div className="col-span-2 mb-3">
                      <Label className="text-sm">Installation Type</Label>
                      <div className="flex items-center justify-between mt-2 p-2 border rounded-md">
                        <Button 
                          type="button"
                          variant={installMode === "application" ? "default" : "outline"}
                          onClick={() => setInstallMode("application")}
                          className="w-full"
                        >
                          Application
                        </Button>
                        <Button 
                          type="button"
                          variant={installMode === "distribution" ? "default" : "outline"}
                          onClick={() => setInstallMode("distribution")}
                          className="w-full"
                        >
                          Clean OS
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {installMode === "application" 
                          ? "Install a pre-configured application on your server." 
                          : "Install a clean operating system without any pre-configured applications."}
                      </p>
                    </div>
                    
                    {installMode === "application" && (
                      <>
                        <div className="col-span-2 mb-1">
                          <Label className="text-sm">Application Type</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Button 
                              type="button"
                              size="sm" 
                              variant={applicationTypeFilter === "all" ? "default" : "outline"} 
                              onClick={() => setApplicationTypeFilter("all")}
                              className="text-xs h-8"
                            >
                              All
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant={applicationTypeFilter === "game-server" ? "default" : "outline"} 
                              onClick={() => setApplicationTypeFilter("game-server")}
                              className="text-xs h-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:text-white"
                            >
                              Game Servers
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant={applicationTypeFilter === "bot" ? "default" : "outline"} 
                              onClick={() => setApplicationTypeFilter("bot")}
                              className="text-xs h-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:text-white"
                            >
                              Discord Bots
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant={applicationTypeFilter === "application" ? "default" : "outline"} 
                              onClick={() => setApplicationTypeFilter("application")}
                              className="text-xs h-8"
                            >
                              Web Dev
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant={applicationTypeFilter === "cms" ? "default" : "outline"} 
                              onClick={() => setApplicationTypeFilter("cms")}
                              className="text-xs h-8"
                            >
                              CMS
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant={applicationTypeFilter === "ecommerce" ? "default" : "outline"} 
                              onClick={() => setApplicationTypeFilter("ecommerce")}
                              className="text-xs h-8"
                            >
                              E-commerce
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant={applicationTypeFilter === "database" ? "default" : "outline"} 
                              onClick={() => setApplicationTypeFilter("database")}
                              className="text-xs h-8"
                            >
                              Database
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant={applicationTypeFilter === "data-science" ? "default" : "outline"} 
                              onClick={() => setApplicationTypeFilter("data-science")}
                              className="text-xs h-8"
                            >
                              Data Science
                            </Button>
                            <Button 
                              type="button"
                              size="sm" 
                              variant={applicationTypeFilter === "devops" ? "default" : "outline"} 
                              onClick={() => setApplicationTypeFilter("devops")}
                              className="text-xs h-8"
                            >
                              DevOps
                            </Button>
                          </div>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="application"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel className="text-sm">Application</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select application" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {applications
                                    .filter(app => applicationTypeFilter === "all" ? true : app.type === applicationTypeFilter)
                                    .map((app) => (
                                      <SelectItem key={app.slug} value={app.slug}>
                                        {app.name}
                                        {app.distribution && (
                                          <span className="text-xs ml-1 text-muted-foreground">
                                            {" "}({distributions.find(d => d.slug === app.distribution)?.name || app.distribution})
                                          </span>
                                        )}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    
                    {installMode === "distribution" && (
                      <FormField
                        control={form.control}
                        name="application"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel className="text-sm">Distribution</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select distribution" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {distributions.map((distro) => (
                                  <SelectItem key={distro.slug} value={distro.slug}>
                                    {distro.name}
                                    <span className="text-xs ml-1 text-muted-foreground"> ({distro.description})</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="text-sm">Server Size</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select server size" />
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
                          <FormLabel className="text-sm">Root Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="h-9" />
                          </FormControl>
                          <div className="mt-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs">Password Strength</span>
                              <span className="text-xs">{passwordStrength}%</span>
                            </div>
                            <Progress value={passwordStrength} className="h-1.5" />
                          </div>
                          <FormDescription className="text-xs">
                            This password will be used to access your server via the web terminal.
                          </FormDescription>
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
            {filteredServers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}