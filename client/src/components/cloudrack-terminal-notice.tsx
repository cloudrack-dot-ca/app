import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Key } from "lucide-react";

/**
 * CloudRack Terminal Notice Component
 * 
 * This component shows an informational banner about SSH keys for terminal access.
 */
export function CloudRackTerminalNotice() {
  return (
    <Alert className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
      <Key className="h-5 w-5 text-blue-600 dark:text-blue-500" />
      <AlertTitle className="text-blue-800 dark:text-blue-400">Terminal Access SSH Key</AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-300">
        <p className="mt-2">
          CloudRack uses a system SSH key (fingerprint: c0:62:80:ae:2a:05:66:22:cb:d1:64:6e:54:c2:2c:ca) which is
          automatically added to all your VPS servers during creation. This key allows secure terminal access
          directly from the CloudRack web interface, eliminating the need for password authentication.
        </p>
        <p className="mt-2">
          <strong>How it works:</strong> When you create a new server, this key is added to the server's 
          <code className="mx-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">~/.ssh/authorized_keys</code> 
          file, allowing secure key-based authentication between CloudRack and your server instances.
        </p>
      </AlertDescription>
    </Alert>
  );
}