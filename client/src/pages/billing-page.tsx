import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, DollarSign } from "lucide-react";
import { BillingTransaction } from "@shared/schema";
import { Link } from "wouter";

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<BillingTransaction[]>({
    queryKey: ["/api/billing/transactions"],
  });

  async function createOrder() {
    try {
      const response = await apiRequest("POST", "/api/billing/deposit", { amount: 10000 }); // $100.00
      const data = await response.json();
      return data.id;
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  const onApprove = async (data: any) => {
    try {
      await apiRequest("POST", `/api/billing/capture/${data.orderID}`);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Refresh user to get updated balance
      queryClient.invalidateQueries({ queryKey: ["/api/billing/transactions"] });
      toast({
        title: "Success",
        description: "Funds have been added to your account!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (loadingTransactions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Billing</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-4">
              ${((user?.balance || 0) / 100).toFixed(2)}
            </p>
            <p className="text-muted-foreground mb-6">Add funds to your account to pay for servers and storage</p>
            <PayPalButtons
              style={{ layout: "vertical" }}
              createOrder={createOrder}
              onApprove={onApprove}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>1GB RAM, 1 vCPU</span>
                <span>$5/mo</span>
              </li>
              <li className="flex justify-between">
                <span>2GB RAM, 1 vCPU</span>
                <span>$10/mo</span>
              </li>
              <li className="flex justify-between">
                <span>4GB RAM, 2 vCPU</span>
                <span>$20/mo</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">$0.10/GB</p>
            <p className="text-muted-foreground">Per month for block storage volumes</p>
          </CardContent>
        </Card>
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
                        {tx.type === 'deposit' ? 'Added Funds' : 
                         tx.type === 'server_charge' ? 'Server Charge' : 
                         'Volume Charge'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}${(tx.amount / 100).toFixed(2)}
                      </span>
                      <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}