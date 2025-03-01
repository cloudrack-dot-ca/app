import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Key, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

interface SystemKeyStatus {
  status: "active" | "missing";
  key?: {
    id: number;
    name: string;
    publicKey: string;
    createdAt: string;
  };
  fingerprint: string;
  publicKey?: string;
}

/**
 * System Key Notice Component
 * 
 * This component shows information about the System SSH Key
 * and provides functionality to ensure it exists and is configured correctly.
 */
export function SystemKeyNotice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const { data: systemKeyStatus, isLoading } = useQuery<SystemKeyStatus>({
    queryKey: ["/api/system-key"],
  });
  
  const ensureSystemKey = async (regenerate: boolean = false) => {
    try {
      setIsRegenerating(true);
      await apiRequest("POST", "/api/system-key", { regenerate });
      
      // Refresh the key status and the SSH keys list
      queryClient.invalidateQueries({ queryKey: ["/api/system-key"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ssh-keys"] });
      
      toast({
        title: "Success",
        description: regenerate 
          ? "System key has been regenerated successfully" 
          : "System key has been ensured successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };
  
  if (isLoading) {
    return (
      <Alert className="mb-6 bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <AlertTitle>Checking system key status...</AlertTitle>
      </Alert>
    );
  }
  
  if (!systemKeyStatus) {
    return null;
  }
  
  if (systemKeyStatus.status === "active") {
    return (
      <Alert className="mb-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
        <Key className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-700 dark:text-green-300">System Key is Active</AlertTitle>
        <AlertDescription className="text-green-600/90 dark:text-green-400/90">
          <p>
            Your account has the system SSH key properly configured. This key is automatically added 
            to any new servers you create, ensuring you always have access.
          </p>
          <p className="mt-2">
            <span className="font-mono text-xs bg-green-100 dark:bg-green-900/30 px-1 rounded">
              Fingerprint: {systemKeyStatus.fingerprint}
            </span>
          </p>
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900"
              onClick={() => ensureSystemKey(true)}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-2" />
              )}
              Regenerate Key
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-700 dark:text-amber-300">System Key Missing</AlertTitle>
      <AlertDescription className="text-amber-600/90 dark:text-amber-400/90">
        <p>
          Your account is missing the CloudRack system SSH key. This key ensures access to your VPS servers.
          It's recommended to add this key to your account for full system compatibility.
        </p>
        <p className="mt-2">
          <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/30 px-1 rounded">
            Fingerprint: {systemKeyStatus.fingerprint}
          </span>
        </p>
        <div className="mt-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
            onClick={() => ensureSystemKey(false)}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : (
              <Key className="h-3 w-3 mr-2" />
            )}
            Add System Key
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}