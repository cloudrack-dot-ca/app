import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import PricingTable from "@/components/pricing-table";
import LocationMap from "@/components/location-map";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">CloudHost</h1>
          <div className="space-x-4">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/auth">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">High-Performance VPS Hosting</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Deploy your applications on powerful virtual servers with worldwide locations.
            Powered by DigitalOcean infrastructure.
          </p>
          <Button size="lg" asChild>
            <Link href={user ? "/dashboard" : "/auth"}>Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Data Center Image Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">World-Class Data Centers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "https://images.unsplash.com/photo-1653389526309-f8e2e75f8aaf",
              "https://images.unsplash.com/photo-1653389527532-884074ac1c65",
              "https://images.unsplash.com/photo-1653389523425-c1f572a4c3f0",
              "https://images.unsplash.com/photo-1653389524385-9d831f930d83"
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Data Center ${i + 1}`}
                className="w-full h-48 object-cover rounded-lg shadow-md"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Location Map */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Global Infrastructure</h2>
          <LocationMap />
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <PricingTable />
        </div>
      </section>
    </div>
  );
}
