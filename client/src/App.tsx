import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import MaintenanceSettings from "@/pages/admin/maintenance";

// Import all existing page components
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ApiDocs from "@/pages/api-docs-page";
import ApiKey from "@/pages/api-key-page";
import Auth from "@/pages/auth-page";
import Account from "@/pages/account-page";
import Billing from "@/pages/billing-page";
import Support from "@/pages/support-page";
import Terminal from "@/pages/terminal-page";
import Volumes from "@/pages/volumes-page";
import BandwidthDetails from "@/pages/bandwidth-details";
import Docs from "@/pages/docs-page";
import ServerDetail from "@/pages/server-detail";
import Home from "@/pages/home-page";

function Router() {
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/admin/maintenance" component={MaintenanceSettings} />
      <Route path="/admin/dashboard" component={AdminDashboard} />

      {/* Main routes */}
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/api-docs" component={ApiDocs} />
      <Route path="/api-key" component={ApiKey} />
      <Route path="/auth" component={Auth} />
      <Route path="/account" component={Account} />
      <Route path="/billing" component={Billing} />
      <Route path="/support" component={Support} />
      <Route path="/terminal" component={Terminal} />
      <Route path="/volumes" component={Volumes} />
      <Route path="/bandwidth" component={BandwidthDetails} />
      <Route path="/docs" component={Docs} />
      <Route path="/server/:id" component={ServerDetail} />

      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;