import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import BillingPage from "@/pages/billing-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/billing" component={BillingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PayPalScriptProvider options={{
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
        currency: "USD",
        intent: "capture",
        components: "buttons",
        "data-client-token": "abc",
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