import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

/**
 * CloudRack Terminal Notice Component
 * 
 * This component shows an informational banner about the CloudRack Terminal Key.
 * It explains how the web terminal works and what happens if the key is removed.
 */
export function CloudRackTerminalNotice() {
  return (
    <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-800 dark:text-amber-400">CloudRack Terminal Access</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <p className="mt-2">
          CloudRack uses a managed SSH key to provide secure web terminal access to your servers. 
          This key is automatically added to your servers during creation.
        </p>
        <p className="mt-2">
          <strong>Important:</strong> If you delete the "CloudRack Terminal Key" from your SSH keys, 
          you will lose web terminal access to all of your servers. You will still be able to connect 
          via your own SSH keys.
        </p>
      </AlertDescription>
    </Alert>
  );
}