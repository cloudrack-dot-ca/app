import { Switch, Route, Link } from "wouter";
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
import ServerDetailPage from "@/pages/server-detail";
import SSHKeysPage from "@/pages/ssh-keys";
import AccountPage from "@/pages/account-page";
import AdminDashboard from "@/pages/admin/dashboard";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Button } from "@/components/ui/button";
import { Home, ShieldCheck, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect } from "react";

function Nav() {
  const { user } = useAuth();

  // Setup theme on initial load
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else if (theme === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      }
    }
  }, []);

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
        <div className="flex items-center gap-2">
          {user && user.isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

// Footer component with CloudRack branding
function Footer() {
  return (
    <footer className="mt-auto border-t py-4">
      <div className="container mx-auto px-4 flex justify-center items-center">
        <p className="text-sm text-muted-foreground">
          CloudRack 2025 Powered By Repl.it
        </p>
      </div>
    </footer>
  );
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Nav />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/dashboard" component={Dashboard} />
          <ProtectedRoute path="/volumes" component={VolumesPage} />
          <ProtectedRoute path="/billing" component={BillingPage} />
          <ProtectedRoute path="/support" component={SupportPage} />
          <ProtectedRoute path="/support/:id" component={SupportPage} />
          <ProtectedRoute path="/ssh-keys" component={SSHKeysPage} />
          <ProtectedRoute path="/account" component={AccountPage} />
          <ProtectedRoute path="/admin" component={AdminDashboard} />
          {/* Make sure this is the only server route to avoid conflicts */}
          <ProtectedRoute path="/servers/:id" component={ServerDetailPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
    </div>
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