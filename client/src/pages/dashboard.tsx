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
import { Loader2, Plus, Search, LockKeyhole, Key } from "lucide-react";
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
}

interface Application {
  slug: string;
  name: string;
  description: string;
  type: string;
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
  const [selectedSSHKeyId, setSelectedSSHKeyId] = useState<number | null>(null);
  const [newKeyName, setNewKeyName] = useState(""); 
  

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

  const { data: sshKeys = [] } = useQuery<SSHKey[]>({
    queryKey: ["/api/ssh-keys"],
  });

  const form = useForm({
    resolver: zodResolver(
      insertServerSchema.extend({
        auth: insertServerSchema.shape.name.refine(
          (value) => {
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
      // If adding a new SSH key, save it first
      let sshKeyToUse = selectedSSHKeyId && selectedSSHKeyId !== "new" 
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
          sshKeyToUse = response.publicKey;
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
              <Link href="/volumes">Volumes</Link>
            </Button>
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Server</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Server Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a region" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="application"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an application" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {applications.map((app) => (
                                <SelectItem key={app.slug} value={app.slug}>
                                  {app.name}
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {app.description}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sizes.map((size) => (
                                <SelectItem key={size.slug} value={size.slug}>
                                  {size.memory / 1024}GB RAM, {size.vcpus} vCPUs (${(size.price_monthly / (24 * 30)).toFixed(3)}/hr)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4">
                      <Label>Authentication Method</Label>
                      <RadioGroup
                        defaultValue="password"
                        onValueChange={(value) => {
                          setAuthType(value as "password" | "ssh");
                          setSelectedSSHKeyId(null);
                          setSshKey("");
                          setNewKeyName(""); 
                        }}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div>
                          <RadioGroupItem value="password" id="password" className="peer sr-only" />
                          <Label
                            htmlFor="password"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <LockKeyhole className="mb-2" />
                            Password
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="ssh" id="ssh" className="peer sr-only" />
                          <Label
                            htmlFor="ssh"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Key className="mb-2" />
                            SSH Key
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {authType === "password" ? (
                      <FormField
                        control={form.control}
                        name="auth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <Progress value={passwordStrength} className="h-2" />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <FormLabel>SSH Keys</FormLabel>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href="/ssh-keys">Manage SSH Keys</Link>
                          </Button>
                        </div>
                        {sshKeys.length > 0 ? (
                          <Select
                            value={selectedSSHKeyId?.toString() || ""}
                            onValueChange={(value) => {
                              setSelectedSSHKeyId(parseInt(value));
                              setSshKey("");
                              setNewKeyName(""); 
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an existing SSH key" />
                            </SelectTrigger>
                            <SelectContent>
                              {sshKeys.map((key) => (
                                <SelectItem key={key.id} value={key.id.toString()}>
                                  {key.name}
                                </SelectItem>
                              ))}
                              <SelectItem value="new">Use a new SSH key</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No SSH keys found. Add one below or manage your keys in the <Link href="/ssh-keys" className="text-primary hover:underline">SSH Keys page</Link>.
                          </div>
                        )}

                        {(!selectedSSHKeyId || selectedSSHKeyId === "new") && (
                          <div className="space-y-4">
                            <FormItem>
                              <FormLabel>SSH Key Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., My Work Laptop"
                                  value={newKeyName}
                                  onChange={(e) => setNewKeyName(e.target.value)}
                                />
                              </FormControl>
                            </FormItem>
                            <FormItem>
                              <FormLabel>SSH Public Key</FormLabel>
                              <FormControl>
                                <Textarea
                                  value={sshKey}
                                  onChange={(e) => setSshKey(e.target.value)}
                                  className="font-mono text-sm"
                                  placeholder="Paste your SSH public key here"
                                />
                              </FormControl>
                            </FormItem>
                          </div>
                        )}
                      </div>
                    )}
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create Server"
                      )}
                    </Button>
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