import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Cpu } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface Size {
  slug: string;
  memory: number;
  vcpus: number;
  disk: number;
  transfer: number;
  price_monthly: number;
  processor_type?: 'regular' | 'intel' | 'amd' | 'gpu';
}

export default function PricingTable() {
  const { user } = useAuth();
  const { data: sizes = [] } = useQuery<Size[]>({
    queryKey: ["/api/sizes"],
  });

  // Get processor type display info
  const getProcessorBadge = (type: string | undefined) => {
    if (!type) return null;
    
    const variants: Record<string, {color: string, label: string}> = {
      'regular': { color: 'default', label: 'Standard SSD' },
      'intel': { color: 'blue', label: 'Intel Optimized' },
      'amd': { color: 'red', label: 'AMD Optimized' },
      'gpu': { color: 'green', label: 'GPU Accelerated' }
    };
    
    const info = variants[type] || variants.regular;
    
    return (
      <Badge variant={info.color as any} className="ml-2">
        <Cpu className="h-3 w-3 mr-1" />
        {info.label}
      </Badge>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sizes.map((size: Size) => (
        <Card key={size.slug}>
          <CardHeader>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl flex items-center">
                {size.memory / 1024}GB
                <span className="text-lg text-muted-foreground"> RAM</span>
                {getProcessorBadge(size.processor_type)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {size.slug}
              </p>
            </div>
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
                {size.vcpus} vCPUs{size.processor_type ? ` (${size.processor_type})` : ''}
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
