import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Subscription, BillingTransaction } from "@shared/schema";

type Plan = {
  id: string;
  name: string;
  description: string;
  price: number;
};

type Plans = Record<string, Plan>;

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: plans = {} as Plans } = useQuery<Plans>({
    queryKey: ["/api/billing/plans"],
  });

  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/billing/subscriptions"],
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<BillingTransaction[]>({
    queryKey: ["/api/billing/transactions"],
  });

  const createOrder = async (planId: string) => {
    try {
      const response = await apiRequest("POST", "/api/billing/subscribe", { planId });
      const data = await response.json();
      return data.id;
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const onApprove = (planId: string) => async (data: any) => {
    try {
      await apiRequest("POST", `/api/billing/capture/${data.orderID}`, { planId });
      toast({
        title: "Success",
        description: "Your subscription has been activated!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (loadingSubscriptions || loadingTransactions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Billing & Subscriptions</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {Object.entries(plans).map(([id, plan]) => (
          <Card key={id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold mb-4">${plan.price}/mo</p>
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              <PayPalButtons
                createOrder={() => createOrder(id)}
                onApprove={onApprove(id)}
                style={{ layout: "horizontal" }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Active Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No active subscriptions
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{plans[sub.planId]?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(sub.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                        {sub.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No transactions yet
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          ${(tx.amount / 100).toFixed(2)} {tx.currency}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                        {tx.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}