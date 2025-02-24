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
import React, { useState } from 'react'; // Added import for useState

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
        "client-id": process.env.VITE_PAYPAL_CLIENT_ID || "YOUR_PAYPAL_CLIENT_ID", // Updated clientId and used process.env for security. Replace YOUR_PAYPAL_CLIENT_ID with your actual client ID.
        currency: "USD",
        intent: "capture",
        components: "buttons",
        enableFunding: "paypal",
        disableFunding: "card,paylater",
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