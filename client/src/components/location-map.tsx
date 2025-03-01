import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Server, 
  Cpu, 
  Info, 
  Star,
  Network,
  Clock
} from "lucide-react";

interface Region {
  slug: string;
  name: string;
  sizes: string[];
  available: boolean;
}

interface DataCenter {
  id: string;
  name: string;
  position: { x: number; y: number; };
  region: string;
  isPremium?: boolean;
  features?: string[];
}

export default function LocationMap() {
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  // Define key data centers based on regions
  const dataCenters: DataCenter[] = [
    { 
      id: "nyc1", 
      name: "New York", 
      position: { x: 30, y: 33 }, 
      region: "North America",
      isPremium: true,
      features: ["High Bandwidth", "Low Latency", "Disaster Recovery"]
    },
    { 
      id: "sfo1", 
      name: "San Francisco", 
      position: { x: 18, y: 34 }, 
      region: "North America" 
    },
    { 
      id: "ams3", 
      name: "Amsterdam", 
      position: { x: 48, y: 26 }, 
      region: "Europe",
      isPremium: true,
      features: ["High Availability", "Carbon Neutral", "Edge Computing"]
    },
    { 
      id: "sgp1", 
      name: "Singapore", 
      position: { x: 73, y: 50 }, 
      region: "Asia Pacific",
      features: ["Low Latency", "High Bandwidth"]
    },
    { 
      id: "lon1", 
      name: "London", 
      position: { x: 45, y: 27 }, 
      region: "Europe" 
    },
    { 
      id: "fra1", 
      name: "Frankfurt", 
      position: { x: 50, y: 28 }, 
      region: "Europe" 
    },
    { 
      id: "blr1", 
      name: "Bangalore", 
      position: { x: 68, y: 45 }, 
      region: "Asia Pacific" 
    },
    { 
      id: "tor1", 
      name: "Toronto", 
      position: { x: 27, y: 30 }, 
      region: "North America" 
    },
  ];

  // Find the selected data center
  const activeCenter = dataCenters.find(center => center.id === selectedCenter);

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
          alt="World Map"
          className="w-full rounded-lg object-cover"
          style={{ height: "600px" }}
        />
        <div className="absolute inset-0 bg-black/50 rounded-lg">
          {/* Data center pins on map */}
          {dataCenters.map((center) => (
            <button
              key={center.id}
              className={`absolute w-4 h-4 rounded-full 
                ${selectedCenter === center.id 
                  ? 'bg-primary animate-pulse ring-4 ring-primary/20' 
                  : 'bg-white hover:bg-primary/80 hover:scale-150'} 
                transition-all duration-300 ease-in-out`}
              style={{ 
                left: `${center.position.x}%`, 
                top: `${center.position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => setSelectedCenter(center.id)}
              title={center.name}
            />
          ))}

          {/* Information overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6">
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-6 text-white">
              {activeCenter ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold">{activeCenter.name} Data Center</h3>
                      {activeCenter.isPremium && (
                        <Badge variant="secondary" className="ml-2">
                          <Star className="h-3 w-3 mr-1 text-yellow-400" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedCenter(null)}
                    >
                      Back to Map
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-md font-semibold mb-2 flex items-center">
                        <Server className="h-4 w-4 mr-2" />
                        Region Information
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li>Region: {activeCenter.region}</li>
                        <li>Datacenter ID: {activeCenter.id}</li>
                        <li>Available Server Types: {
                          regions.find(r => r.slug === activeCenter.id)?.sizes.length || 'Loading...'
                        }</li>
                        <li>Status: <span className="text-green-400">Active</span></li>
                      </ul>
                    </div>
                    
                    {activeCenter.features && (
                      <div>
                        <h4 className="text-md font-semibold mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2" />
                          Special Features
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {activeCenter.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center text-sm text-primary">
                      <Network className="h-4 w-4 mr-1" />
                      <span>Multiple network providers</span>
                    </div>
                    <div className="flex items-center text-sm text-primary">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>99.99% Uptime guarantee</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold">Global Infrastructure</h3>
                  <p className="text-gray-300 max-w-2xl mx-auto">
                    CloudRack operates {dataCenters.length} strategically positioned data centers around the world.
                    Click on any location pin to learn more about our infrastructure in that region.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2">
                    {dataCenters.map(center => (
                      <Button 
                        key={center.id}
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center gap-2"
                        onClick={() => setSelectedCenter(center.id)}
                      >
                        <MapPin className="h-3 w-3" />
                        {center.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
