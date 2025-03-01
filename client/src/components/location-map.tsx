import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function LocationMap() {
  const { data: regions = [] } = useQuery({
    queryKey: ["/api/regions"],
  });

  return (
    <div className="relative">
      <img
        src="https://images.unsplash.com/photo-1713862032476-f75077d3221c"
        alt="World Map"
        className="w-full rounded-lg"
      />
      <div className="absolute inset-0 bg-black/50 rounded-lg">
        <div className="p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Available Regions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regions.map((region) => (
              <Card
                key={region.slug}
                className="bg-white/10 backdrop-blur p-4 rounded-lg"
              >
                <h4 className="font-semibold">{region.name}</h4>
                <p className="text-sm opacity-80">
                  {region.sizes.length} configurations available
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
