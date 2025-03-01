import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

/**
 * CloudRack Terminal Notice Component
 * 
 * This component shows an informational banner about the transition from CloudRack Terminal Key
 * to the new System Key approach.
 */
export function CloudRackTerminalNotice() {
  return (
    <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
      <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-500" />
      <AlertTitle className="text-blue-800 dark:text-blue-400">SSH System Key Update</AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-300">
        <p className="mt-2">
          CloudRack has upgraded the SSH key system to provide more secure and standardized access to your servers.
          The System Key is now used for web terminal access and is automatically added to your servers during creation.
        </p>
        <p className="mt-2">
          <strong>Transition Notice:</strong> The legacy "CloudRack Terminal Key" is being phased out.
          If you're still using it, please ensure you have the System Key installed to maintain terminal access.
        </p>
      </AlertDescription>
    </Alert>
  );
}