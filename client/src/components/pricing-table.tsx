import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function PricingTable() {
  const { user } = useAuth();
  const { data: sizes = [] } = useQuery({
    queryKey: ["/api/sizes"],
  });

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sizes.map((size) => (
        <Card key={size.slug}>
          <CardHeader>
            <CardTitle className="text-2xl">
              {size.memory / 1024}GB
              <span className="text-lg text-muted-foreground"> RAM</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold">
              ${size.price_monthly}
              <span className="text-lg text-muted-foreground font-normal">
                {" "}
                /mo
              </span>
            </p>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-primary" />
                {size.vcpus} vCPUs
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-primary" />
                {size.disk}GB SSD Storage
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-primary" />
                {size.transfer}GB Transfer
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-primary" />
                Global Availability
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href={user ? "/dashboard" : "/auth"}>
                Get Started
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
