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
            {/* North America */}
            <path
              d="M 150 120 L 100 120 L 80 140 L 60 160 L 40 200 L 30 230 L 50 250 L 80 270 L 110 280 L 140 290 L 170 270 L 190 250 L 210 230 L 220 200 L 230 180 L 250 160 L 240 140 L 220 130 L 190 125 L 150 120"
              fill="#ffffff"
            />
            {/* South America */}
            <path
              d="M 230 280 L 210 300 L 200 330 L 210 360 L 230 380 L 250 400 L 270 420 L 290 410 L 310 390 L 320 360 L 330 330 L 320 310 L 300 290 L 280 280 L 250 270 L 230 280"
              fill="#ffffff"
            />
            {/* Europe */}
            <path
              d="M 450 120 L 420 130 L 400 140 L 380 160 L 370 180 L 380 200 L 410 210 L 440 220 L 470 210 L 490 190 L 510 170 L 520 150 L 500 130 L 470 120 L 450 120"
              fill="#ffffff"
            />
            {/* Africa */}
            <path
              d="M 450 230 L 420 240 L 400 270 L 390 300 L 400 330 L 420 350 L 440 370 L 470 380 L 500 370 L 520 350 L 530 320 L 520 290 L 500 260 L 480 240 L 450 230"
              fill="#ffffff"
            />
            {/* Asia */}
            <path
              d="M 550 120 L 520 130 L 500 150 L 490 180 L 500 210 L 520 240 L 550 260 L 580 270 L 610 260 L 640 240 L 670 210 L 690 180 L 700 150 L 680 130 L 650 120 L 600 110 L 550 120"
              fill="#ffffff"
            />
            {/* Australia */}
            <path
              d="M 800 330 L 770 340 L 750 360 L 740 380 L 750 400 L 780 410 L 810 400 L 830 380 L 840 360 L 830 340 L 800 330"
              fill="#ffffff"
            />
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
                  <div className="relative cursor-pointer">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div className="w-8 h-8 bg-primary/30 rounded-full absolute -top-2.5 -left-2.5 animate-pulse"></div>
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
