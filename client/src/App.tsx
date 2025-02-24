import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import BillingPage from "@/pages/billing-page";
import SupportPage from "@/pages/support-page";
import VolumesPage from "@/pages/volumes-page";
import SSHKeysPage from "@/pages/ssh-keys";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import AccountPage from "@/pages/account-page";

function Nav() {
  const { user } = useAuth();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {!user && (
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Nav />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/volumes" component={VolumesPage} />
        <ProtectedRoute path="/billing" component={BillingPage} />
        <ProtectedRoute path="/support" component={SupportPage} />
        <ProtectedRoute path="/ssh-keys" component={SSHKeysPage} />
        <ProtectedRoute path="/account" component={AccountPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PayPalScriptProvider options={{
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
        currency: "USD",
        intent: "capture",
        components: "buttons,marks",
      }}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </PayPalScriptProvider>
    </QueryClientProvider>
  );
}

export default App;