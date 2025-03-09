import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Github, GitBranch, Info } from "lucide-react"; // Ensure this import exists
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";

const deployFormSchema = z.object({
  repo: z.string().min(1, "Repository is required"),
  branch: z.string().min(1, "Branch is required"),
  region: z.string().min(1, "Region is required"),
  size: z.string().min(1, "Size is required"),
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(63, "Name must be 63 characters or less")
    .refine(
      (value) => /^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/i.test(value),
      "Name must be a valid hostname (only letters, numbers, hyphens, and periods allowed)"
    ),
  envVars: z.string().optional(),
});

interface Size {
  slug: string;
  memory: number;
  vcpus: number;
  price_monthly: number;
}

interface Region {
  slug: string;
  name: string;
}

export default function GitHubDeployForm() {
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [showEnvVarsDialog, setShowEnvVarsDialog] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const form = useForm<z.infer<typeof deployFormSchema>>({
    resolver: zodResolver(deployFormSchema),
    defaultValues: {
      repo: "",
      branch: "main",
      region: "",
      size: "",
      name: "",
      envVars: "",
    },
  });

  // Load GitHub repos
  const { data: repos = [], isLoading: isLoadingRepos } = useQuery<any[]>({
    queryKey: ["/api/github/repos"],
  });

  // Load GitHub branches for selected repo
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<string[]>({
    queryKey: [`/api/github/repos/${selectedRepo}/branches`],
    enabled: !!selectedRepo,
    // Mock implementation until API endpoint exists
    queryFn: async () => ["main", "develop", "staging"],
  });

  // Load regions and sizes from API
  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const { data: sizes = [] } = useQuery<Size[]>({
    queryKey: ["/api/sizes"],
  });

  // Handle repo change to populate the app name
  const handleRepoChange = (repoFullName: string) => {
    form.setValue("repo", repoFullName);
    setSelectedRepo(repoFullName);

    // Set a default name based on the repo name
    const repoName = repoFullName.split("/")[1];
    if (repoName) {
      const suggestedName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      form.setValue("name", suggestedName);
    }
  };

  async function onSubmit(values: z.infer<typeof deployFormSchema>) {
    try {
      setIsDeploying(true);

      // Format environment variables if provided
      let envVars = {};
      if (values.envVars) {
        try {
          const lines = values.envVars.split("\n");
          lines.forEach(line => {
            if (line.trim() && line.includes("=")) {
              const [key, ...valueParts] = line.split("=");
              const value = valueParts.join("=");
              envVars[key.trim()] = value.trim();
            }
          });
        } catch (err) {
          console.error("Error parsing env vars:", err);
        }
      }

      // Call API to deploy from GitHub
      await apiRequest("POST", "/api/github/deploy", {
        repo: values.repo,
        branch: values.branch,
        name: values.name,
        region: values.region,
        size: values.size,
        env: envVars
      });

      toast({
        title: "Deployment started",
        description: `Deploying ${values.repo} (${values.branch}) to ${values.name}`,
      });

      // Reset form
      form.reset();

      // Refresh servers list
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      toast({
        title: "Deployment failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  }

  // Loading state when not connected to GitHub
  if (repos.length === 0 && !isLoadingRepos) {
    return (
      <div className="py-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Github className="w-12 h-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="font-medium">GitHub Not Connected</h3>
            <p className="text-sm text-muted-foreground">
              You need to connect your GitHub account before deploying applications.
            </p>
          </div>
          <Button asChild>
            <Link href="/account#github">Connect GitHub Account</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="repo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repository</FormLabel>
              <Select
                onValueChange={handleRepoChange}
                defaultValue={field.value}
                disabled={isLoadingRepos}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select repository" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-60">
                  {isLoadingRepos ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading repositories...</span>
                    </div>
                  ) : (
                    repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.full_name}>
                        {repo.full_name}
                        {repo.private && (
                          <span className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">private</span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="branch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!selectedRepo || isLoadingBranches}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingBranches ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading branches...</span>
                    </div>
                  ) : (
                    branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        <div className="flex items-center">
                          <GitBranch className="h-4 w-4 mr-2" />
                          {branch}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., my-app" />
              </FormControl>
              <FormDescription className="text-xs">
                This will be used as the hostname and URL for your app.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sizes.map((size) => (
                      <SelectItem key={size.slug} value={size.slug}>
                        {size.memory / 1024}GB RAM, {size.vcpus} vCPUs
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowEnvVarsDialog(true)}
            className="w-full"
          >
            Configure Environment Variables
          </Button>
        </div>

        <Alert className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800">
          <AlertTitle className="flex items-center text-sm font-medium">
            <Info className="h-4 w-4 mr-2" /> Deployment Information
          </AlertTitle>
          <AlertDescription className="text-xs mt-2">
            The system will automatically detect your project type and configure the build process.
            Supported frameworks include Node.js, Python, Docker, Ruby, PHP, and static websites.
          </AlertDescription>
        </Alert>

        <Button
          type="submit"
          className="w-full"
          disabled={isDeploying}
        >
          {isDeploying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Github className="h-4 w-4 mr-2" />
              Deploy Application
            </>
          )}
        </Button>
      </form>

      <Dialog open={showEnvVarsDialog} onOpenChange={setShowEnvVarsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Environment Variables</DialogTitle>
            <DialogDescription>
              Add environment variables for your application (one per line, in KEY=VALUE format)
            </DialogDescription>
          </DialogHeader>
          <FormField
            control={form.control}
            name="envVars"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <textarea
                    className="w-full min-h-[200px] p-2 border rounded-md font-mono text-sm"
                    placeholder="DATABASE_URL=postgres://user:password@host:port/dbname
PORT=3000
NODE_ENV=production"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  These will be securely stored and made available to your application at runtime.
                </FormDescription>
              </FormItem>
            )}
          />
          <Button onClick={() => setShowEnvVarsDialog(false)}>Save Variables</Button>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
