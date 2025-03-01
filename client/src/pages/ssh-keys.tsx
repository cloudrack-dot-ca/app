import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Key, Plus, Trash2, Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CloudRackTerminalNotice } from "@/components/cloudrack-terminal-notice";
import { SystemKeyNotice } from "@/components/system-key-notice";
import { Badge } from "@/components/ui/badge";

interface SSHKey {
  id: number;
  name: string;
  publicKey: string;
  createdAt: string;
  isCloudRackKey?: boolean;
  isSystemKey?: boolean;
}

export default function SSHKeysPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyContent, setNewKeyContent] = useState("");

  const { data: keys = [], isLoading } = useQuery<SSHKey[]>({
    queryKey: ["/api/ssh-keys"],
  });

  const addKey = async () => {
    if (!newKeyName.trim() || !newKeyContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Both name and public key are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingKey(true);
      await apiRequest("POST", "/api/ssh-keys", {
        name: newKeyName.trim(),
        publicKey: newKeyContent.trim(),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/ssh-keys"] });
      setNewKeyName("");
      setNewKeyContent("");
      toast({
        title: "Success",
        description: "SSH key has been added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsAddingKey(false);
    }
  };

  const deleteKey = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/ssh-keys/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/ssh-keys"] });
      toast({
        title: "Success",
        description: "SSH key has been deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">SSH Keys</h1>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <CloudRackTerminalNotice />
        <SystemKeyNotice />
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Your SSH Keys</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add SSH Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., My Laptop"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Public Key</Label>
                  <Textarea
                    placeholder="Paste your SSH public key here"
                    value={newKeyContent}
                    onChange={(e) => setNewKeyContent(e.target.value)}
                    className="font-mono text-sm h-32"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={addKey}
                  disabled={isAddingKey}
                >
                  {isAddingKey ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No SSH keys added yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first SSH key to enable key-based authentication for your servers
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <Card 
                key={key.id} 
                className={
                  key.isCloudRackKey 
                    ? "border-amber-300 dark:border-amber-700" 
                    : key.isSystemKey 
                      ? "border-green-300 dark:border-green-700" 
                      : ""
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-semibold">
                      {key.name}
                    </CardTitle>
                    {key.isCloudRackKey && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        CloudRack Terminal Key
                      </Badge>
                    )}
                    {key.isSystemKey && (
                      <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        System Key
                      </Badge>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete SSH Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          {key.isCloudRackKey ? (
                            <>
                              <p className="text-amber-600 dark:text-amber-400 font-semibold mb-2">
                                Warning: This is the CloudRack Terminal Key
                              </p>
                              <p>
                                Deleting this key will disable web terminal access to ALL of your servers. 
                                You will still be able to connect to your servers using your other SSH keys.
                              </p>
                              <p className="mt-2">
                                Are you sure you want to delete this key?
                              </p>
                            </>
                          ) : key.isSystemKey ? (
                            <>
                              <p className="text-green-600 dark:text-green-400 font-semibold mb-2">
                                Warning: This is the CloudRack System Key
                              </p>
                              <p>
                                Deleting this key will remove automated access to your VPS servers.
                                You will need to manually add your SSH keys to new servers.
                              </p>
                              <p className="mt-2">
                                Are you sure you want to delete this key?
                              </p>
                            </>
                          ) : (
                            "Are you sure you want to delete this SSH key? This action cannot be undone."
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteKey(key.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm break-all">{key.publicKey}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground mt-2">
                      Added on {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                    {key.isCloudRackKey && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        Used for web terminal access
                      </p>
                    )}
                    {key.isSystemKey && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Used for automated VPS access
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}