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
          <h1 className="text-2xl font-bold">CloudRack</h1>
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
            Powered by CloudRack's next-generation infrastructure.
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
              "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1585008530115-91c9887f3cb0?q=80&w=2073&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1606765962248-7ff407b51667?q=80&w=1975&auto=format&fit=crop"
            ].map((src, i) => (
              <div key={i} className="relative group overflow-hidden rounded-lg shadow-lg">
                <img
                  src={src}
                  alt={`CloudRack Data Center ${i + 1}`}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                  <div className="text-white font-semibold">
                    {i === 0 && "North America Facility"}
                    {i === 1 && "Asia Pacific Facility"}
                    {i === 2 && "European Facility"}
                    {i === 3 && "Server Infrastructure"}
                  </div>
                </div>
              </div>
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
