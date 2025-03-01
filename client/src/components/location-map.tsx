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
  'nyc1': { top: '38%', left: '26%', name: 'New York' },
  'sfo1': { top: '38%', left: '16%', name: 'San Francisco' },
  'tor1': { top: '32%', left: '25%', name: 'Toronto' },
  'ams3': { top: '29%', left: '48%', name: 'Amsterdam' },
  'lon1': { top: '28%', left: '45%', name: 'London' },
  'fra1': { top: '31%', left: '49%', name: 'Frankfurt' },
  'sgp1': { top: '56%', left: '75%', name: 'Singapore' },
  'blr1': { top: '53%', left: '68%', name: 'Bangalore' },
  'syd1': { top: '70%', left: '84%', name: 'Sydney' },
};

export default function LocationMap() {
  const { data: regions = [] } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  return (
    <TooltipProvider>
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
        {/* World map SVG background */}
        <div className="absolute inset-0 bg-[#0c1527]">
          <svg
            className="w-full h-full opacity-20"
            viewBox="0 0 1000 500"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Simplified world continent outline shapes */}
            
            {/* North America */}
            <path
              d="M201.49,95.79c-4.31,1.31-8.67,2.79-12.96,4.23-6.02,0.37-9.94,5.35-14.97,8.08-3.48,5.24-9.69,5.3-14.31,8.22-3.25,4.17-6.26,8.57-10.57,11.64-8.88,0.88-12.92,10.16-21.52,11.64-5.43,6.42-15.06,5.27-20.75,11.12,2.11,7.88-5.99,10.34-9.7,15.19-1.79,3.8-3.25,7.76-5.51,11.3-4.01,2.47-11.35-2.2-12.62,4.17-3.86,3.56-7.45,7.37-10.59,11.51,1.61,6.53-6.54,8.57-7.48,14.39-6.58,6.91-3.77,17.8-9.64,25.2-4.42,0.62-4.03,5.9-1.47,8.23,6.26,3.04,6.84,10.63,12.27,14.63,0.95,4.82,9.03,5.04,7.96,11.13,2.44,6.7,10.02,5.22,15.32,7.42,2.66,5.1,10.88,3.47,14.76,6.96,6.39-0.55,11.47,4.66,17.5,6.18,9.63-2.15,17.76,4.17,26.42,7.1,9.69,0.63,19.19,5.26,29.09,3.1,5.63-1.71,10.35-5.26,16.27-6.27,7.76-6.38,19.15-7.01,25.81-14.96,5.29-2.59,7.25-7.83,8.41-13.23,1.36-9.61,8.41-16.15,12.01-24.72,4.94-6.09,3.29-14.71,7.76-21.08-5.34-4.08-4.11-9.63-1.58-14.83,1.62-6.55,5.68-11.14,10.44-15.46,6.73-7.81,13.3-15.77,20.76-22.78,0.32-6.14,9.03-8.08,7.83-14.92-6.53-3.94-13.47-7.81-16.53-15.38-5.55-3.02-12.99-5.04-15.78-11.52-8.35-3.77-15.89-8.9-25.1-10.34-5.15-0.11-10.36-0.21-15.34,0.99Z"
              fill="#374151"
            />
            
            {/* South America */}
            <path
              d="M252.69,276.2c-4.47,1.31-5.58,5.98-8.67,8.88-2.44,6.33-6.93,10.69-12.68,14.13,0.58,8.45-5.89,14.28-9.35,21.29-2.59,5.62-0.47,11.31-1.31,17.03-0.72,7.23,0.6,14.72-2.03,21.58,1.56,4.09-0.19,8.26-0.84,12.19,2.78,6.7,0.34,14.18,3.28,20.88,5.25,8.04,11.88,15.49,19.67,21.08,8.67,2.89,16.58,7.65,25.6,9.44,4.42-0.59,9-0.94,13.35,0.1,3.71-3.69,11.35-0.05,10.96-6.69,5.17-5.35,12.67-9.08,14.82-16.73,7.37-2.46,8.37-11.93,15.85-14.22,3.24-6.98,12.73-5.42,14.1-13.76,5.44-3.79,3.09-10.9,7.79-15.07,1.97-7.01-1.2-14.13-0.78-21.19-2.84-3.67-8.56-1.84-12.63-3.72-4.2-5.69-10.27-9.28-17.02-11.31-6.24-4.25-13.96-6.01-19.07-11.98-5.77-4.3-12.2-7.51-18.97-9.65-5.28-1.88-11.2-1.67-15.56-5.62-2.6-3.91-5.84-8.11-10.8-8.51-0.83,1.31-1.64,2.63-2.46,3.94-0.55,0.02-1.65,0.07-2.2,0.09-0.99-3.11-1.93-6.25-2.94-9.37"
              fill="#374151"
            />
            
            {/* Europe */}
            <path
              d="M474.22,127.74c-3.33,2.37-8.16,2.47-10.46,6.28-5.94,4.39-14.65,2.57-19.41,9.12,0.42,4.19-1.1,8.34-2.56,12.16,4.26,4.72,1.99,10.87,2.51,16.42-7.13,1.67-11.49,7.54-16.58,12.31-1.99,2.99-5.52,6.63-3.3,10.53,2.57,2.25,6.26,1.52,9.38,2.46,4.52,1.16,9.9-0.36,13.78,2.89,4.32,0.89,7.85,3.67,12,5.04,6.13,0.1,11.66,3.51,17.96,2.09,4.21-1.89,7.76-5.15,12.37-6.27,6.32-1.51,12.32-4.5,19.04-4.39,6.48,1.98,13.46,2.35,20.11,0.83,3.15-3.19,4.84-8.23,9.71-9.17,5.26-2.97,9.67-7.69,12.12-13.13,0.7-6.39,0.1-13.16-2.83-18.96-4.46-3.88-10.47-5.04-15.99-6.64-3.33-3.29-5.45-7.89-10.03-9.65-7.44-0.51-13.78-4.81-21.22-5.52-5.1,0.63-10.42,0.53-15.34-0.57-2.77-1.09-4.63-3.54-7.02-5.25-0.74-0.21-1.48-0.42-2.24-0.58Z"
              fill="#374151"
            />
            
            {/* Africa */}
            <path
              d="M471.66,235.38c-2.19,4.97-0.63,11.93-5.1,15.59-4.83,10.49-5.73,22.31-6.58,33.71,0.26,6.75,1.83,13.71,0.05,20.35,2.14,4.24,6.53,7.33,7.85,12.06,0.77,4.24,0.05,10.26,4.82,12.67,6.64,4.86,14.24,8.68,20.39,14.29,6.42,5.04,14.45,7.8,21.94,11.04,5.63-0.53,10.88-3.25,16.58-3.93,7.65-1.04,13.26-6.95,18.24-12.57,4.52-3.91,6.37-9.9,9.79-14.76,2.73-4.65,6.05-9.7,3.61-15.17-1.98-5.99-3.84-12.04-5.77-18.02-5.36-9.02-10.27-18.34-17.22-26.09-0.68-9.85-8.42-16.98-15.52-22.94-6.32-0.05-12.48,1.67-18.75,2.25-10.98,1.26-21.07-3.97-31.34-6.69-1.33-1.15-2.03-2.78-2.99-4.29"
              fill="#374151"
            />
            
            {/* Asia */}
            <path
              d="M562.7,113.18c-5.32,2.62-10.17,6.06-15.79,8.04-3.24,5.25-8.2,8.51-13.4,11.29-5.78,2.56-6.9,9.23-8.36,14.7-0.84,9.92-7.86,19.41-4.68,29.54,1.78,10.84,12.74,15.01,20.23,21.19,3.81,2.93,8.41,6.06,13.52,4.96,6.79-0.67,13.72-0.05,20.17-2.62,7.65-1.25,14.91-4.44,22.84-4.49,7.6,1.77,15.46,2.51,22.95,4.91,5.34,0.94,10.69-1.45,15.89-2.56,7.59-2.56,14.97-6.38,20.18-12.41,6.05-5.94,10.07-13.76,14.03-21.19,2.61-8.2,9.27-13.92,11.87-22.21,3.35-7.54-1.46-15.33-2.51-22.83-8.42-4.49-17.5-8.83-24.33-15.85-6.21-0.1-12.72,0.05-18.66-2.24-8.92-2.33-18.29-2.83-27.42-1.41-9.02,2.09-18.56,3.56-27.17,7.1-6.16,1.83-12.56,3.25-19.36,5.08Z"
              fill="#374151"
            />
            
            {/* Australia */}
            <path
              d="M812.35,337.16c-8.1,0.94-16.36,0.94-24.42,2.04-4.31,3.82-9.53,8.35-8.83,14.92-1.93,5.72-0.21,12.25-3.98,17.27-3.14,6.75-6.16,13.71-8.88,20.61,4.82,4.29,9.63,9.02,15.98,10.69,5.02,3.93,12.25,3.1,17.74,6.06,7.18-2.14,15.26-3.2,19.76-10.01,7.91-6.79,14.35-15.17,17.81-24.87,1.36-3.25,0.89-6.96,1.51-10.32-1.3-8.82-8.14-14.75-13.72-20.88-3.67-2.83-8.2-3.83-12.97-5.51Z"
              fill="#374151"
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
                  <div className="relative cursor-pointer group">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="w-8 h-8 bg-blue-500/30 rounded-full absolute -top-2.5 -left-2.5 animate-ping group-hover:animate-none"></div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full absolute -top-4.5 -left-4.5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="p-0 overflow-hidden">
                  <Card className="w-64 border-0">
                    <div className="p-4 bg-blue-600 text-white">
                      <h4 className="font-bold text-lg">{region.name}</h4>
                      <p className="text-xs opacity-80">{region.slug}</p>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="text-sm font-medium">Available Features:</div>
                      <ul className="text-xs space-y-1">
                        <li>• {region.sizes.length} server configurations</li>
                        <li>• Intel and AMD processor options</li>
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
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm p-3 rounded-lg text-xs text-white">
          <div className="flex items-center mb-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span>Datacenter Location</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs p-1 h-auto mt-1 text-blue-400 hover:text-blue-300" asChild>
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
