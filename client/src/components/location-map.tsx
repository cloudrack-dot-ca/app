import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface Region {
  slug: string;
  name: string;
  sizes: string[];
  available: boolean;
}

interface LocationCoordinate {
  top: string;
  left: string;
  name: string;
}

// Define the locations on the world map
const locationCoordinates: Record<string, LocationCoordinate> = {
  'nyc1': { top: '40%', left: '25%', name: 'New York' },
  'sfo1': { top: '40%', left: '15%', name: 'San Francisco' },
  'tor1': { top: '35%', left: '23%', name: 'Toronto' },
  'ams1': { top: '32%', left: '48%', name: 'Amsterdam' },
  'lon1': { top: '33%', left: '45%', name: 'London' },
  'fra1': { top: '35%', left: '48%', name: 'Frankfurt' },
  'sgp1': { top: '58%', left: '75%', name: 'Singapore' },
  'blr1': { top: '55%', left: '68%', name: 'Bangalore' },
  'syd1': { top: '70%', left: '85%', name: 'Sydney' },
};

export default function LocationMap() {
  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  return (
    <TooltipProvider>
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
        {/* World map SVG background */}
        <div className="absolute inset-0 bg-slate-900">
          <svg
            className="w-full h-full opacity-20"
            viewBox="0 0 1000 500"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M171,336.5c-0.2-3.5-1.6-6.8-4-9.7c1.4-2.8,2.1-6,2.1-9.3c0-6.6-3-12.5-7.7-16.4c1.5-2,2.8-4.3,4-6.6c1.5-3.4,2.2-7.2,2.2-11c0-1.7-0.2-3.4-0.5-5c2-2.2,3.8-4.6,5.3-7.1c1.1-1.7,1.8-3.6,2.1-5.6c0.3-2,0.1-4-0.7-5.9c-1.6-4.3-5.7-7.1-10.1-7.1h-0.2c-1.7,0-3.4,0.4-4.9,1.2c-1.6-1.5-3.4-2.7-5.4-3.5c-1.9-0.9-4-1.3-6.1-1.3c-1.7,0-3.4,0.3-5,0.9c-2.5-3.8-5.7-7-9.5-9.5c-3.8-2.5-8-4.3-12.5-5.3c-2.3-0.5-4.5-0.8-6.8-0.8c-3.1,0-6.2,0.5-9.2,1.5c-4.8,1.6-9.1,4.4-12.3,8.3c-1-0.3-2-0.5-3-0.5c-2.1,0-4.1,0.7-5.7,2c-1.6,1.3-2.7,3.1-3.1,5.2c-0.5,2.4-0.7,4.8-0.7,7.2c0,3.6,0.5,7.1,1.6,10.5c1.1,3.5,2.8,6.8,4.9,9.9c0.1,5.2,1.6,10.2,4.3,14.6c-1.7,2.3-3,4.9-3.9,7.7c-3.1,0.9-5.9,2.4-8.2,4.4c-1.2-0.5-2.5-0.7-3.8-0.7c-2.7,0-5.2,1.1-7.1,3c-1.9,1.9-3,4.4-3,7.1c0,1.3,0.3,2.6,0.7,3.8c-0.9,1-1.7,2.1-2.5,3.3c-1.9,3.1-2.9,6.5-2.9,10.1c0,3.5,1,6.9,2.8,9.9c1.8,3,4.5,5.4,7.6,7.1c-0.2,1.1-0.3,2.2-0.3,3.3c0,2.1,0.4,4.1,1.2,6c1.4,3.3,3.9,6.1,7.1,7.8c3.1,1.7,6.7,2.4,10.3,1.8c1.7-0.3,3.3-0.8,4.9-1.5c1.9,1.4,4,2.4,6.3,3c2.3,0.6,4.7,0.7,7.1,0.3c2.4-0.4,4.6-1.2,6.7-2.5c2.1-1.2,3.9-2.9,5.3-4.8c1.7,0.6,3.4,0.9,5.1,0.9c1.8,0,3.6-0.3,5.4-0.9c1.9-0.7,3.6-1.8,5.1-3.2c1.5-1.4,2.6-3.1,3.4-4.9c2.2,0.8,4.5,1.2,6.9,1.2c5.2,0,10.2-2.1,13.9-5.7c3.7-3.7,5.7-8.7,5.7-13.9C174.5,343.4,173.3,339.7,171,336.5z"
              fill="#ffffff"
            />
            {/* Add more continent paths here */}
          </svg>
        </div>

        {/* Datacenter location markers */}
        {regions.map((region) => {
          const coords = locationCoordinates[region.slug] || 
            { top: '50%', left: '50%', name: region.name };
          
          return (
            <div 
              key={region.slug}
              className="absolute"
              style={{ 
                top: coords.top, 
                left: coords.left,
                transform: 'translate(-50%, -50%)' 
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div className="w-8 h-8 bg-primary/30 rounded-full absolute -top-2.5 -left-2.5 animate-ping-slow"></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="p-0 overflow-hidden">
                  <Card className="w-64 border-0">
                    <div className="p-4 bg-primary text-primary-foreground">
                      <h4 className="font-bold text-lg">{region.name}</h4>
                      <p className="text-xs opacity-80">{region.slug}</p>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="text-sm font-medium">Available Features:</div>
                      <ul className="text-xs space-y-1">
                        <li>• {region.sizes.length} server configurations</li>
                        <li>• High-performance SSD storage</li>
                        <li>• 99.99% uptime SLA</li>
                        <li>• 1 Gbps network</li>
                      </ul>
                      {region.available ? (
                        <div className="text-xs text-green-600 flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-600 mr-1"></div>
                          Available for deployment
                        </div>
                      ) : (
                        <div className="text-xs text-amber-600 flex items-center">
                          <div className="w-2 h-2 rounded-full bg-amber-600 mr-1"></div>
                          Limited availability
                        </div>
                      )}
                    </div>
                  </Card>
                </TooltipContent>
              </Tooltip>
              <div className="text-xs font-semibold text-white absolute mt-2 whitespace-nowrap"
                style={{ transform: 'translateX(-50%)' }}
              >
                {coords.name}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur p-3 rounded-lg border text-xs">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
            <span>Datacenter Location</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs p-1 h-auto mt-1" asChild>
            <a href="#" className="flex items-center">
              <InfoIcon className="h-3 w-3 mr-1" />
              View network status
            </a>
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
