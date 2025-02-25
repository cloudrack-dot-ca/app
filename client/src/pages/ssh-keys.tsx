import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Key, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SSHKey {
  id: number;
  name: string;
  publicKey: string;
  createdAt: string;
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
              <Card key={key.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-semibold">{key.name}</CardTitle>
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
                          Are you sure you want to delete this SSH key? This action cannot be undone.
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
                  <p className="text-sm text-muted-foreground mt-2">
                    Added on {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}