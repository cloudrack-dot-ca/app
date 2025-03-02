import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { InfoIcon, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NetworkUsageProps {
  serverId: number;
  size: string;
}

interface BandwidthData {
  current: number; // Current usage in GB
  limit: number;   // Limit in GB
  periodStart: string;
  periodEnd: string;
  lastUpdated: string;
  overageRate: number; // Rate for overage charges (0.005 = 0.5%)
}

// Custom icon for network
const NetworkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4" />
  </svg>
);

export default function NetworkUsage({ serverId, size }: NetworkUsageProps) {
  // Get bandwidth data from the server
  const { data: bandwidthData, isLoading } = useQuery<BandwidthData>({
    queryKey: [`/api/servers/${serverId}/bandwidth`],
  });

  // Determine bandwidth cap based on the server size
  // This would typically come from the backend, but here's a placeholder
  const getBandwidthInfo = () => {
    if (!bandwidthData) return null;
    
    const usagePercent = (bandwidthData.current / bandwidthData.limit) * 100;
    const isCloseToLimit = usagePercent > 80;
    const isOverLimit = usagePercent > 100;
    
    return {
      usagePercent,
      isCloseToLimit,
      isOverLimit,
      remaining: Math.max(0, bandwidthData.limit - bandwidthData.current)
    };
  };

  const bandwidthInfo = getBandwidthInfo();
  
  const formatBandwidth = (gb: number) => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <NetworkIcon />
            <span>Network Usage</span>
          </CardTitle>
          <CardDescription>Monthly bandwidth consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bandwidthData) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <NetworkIcon />
            <span>Network Usage</span>
          </CardTitle>
          <CardDescription>Monthly bandwidth consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Bandwidth data unavailable</AlertTitle>
            <AlertDescription>
              Unable to retrieve bandwidth usage information for this server.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <NetworkIcon />
          <span>Network Usage</span>
        </CardTitle>
        <CardDescription>
          Monthly bandwidth consumption
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Bandwidth usage is calculated from the 1st day of each month. 
                  Once you exceed your included bandwidth, additional usage will be charged at 0.5% of your monthly server cost per GB.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">
              Used: <span className="font-medium">{formatBandwidth(bandwidthData.current)}</span>
            </span>
            <span className="text-sm">
              Limit: <span className="font-medium">{formatBandwidth(bandwidthData.limit)}</span>
            </span>
          </div>
          
          <Progress 
            value={Math.min(100, bandwidthInfo?.usagePercent || 0)} 
            className={`h-2 ${
              bandwidthInfo?.isOverLimit 
                ? "[&>div]:bg-destructive" 
                : bandwidthInfo?.isCloseToLimit 
                ? "[&>div]:bg-amber-500" 
                : ""
            }`}
          />
          
          <div className="text-sm text-muted-foreground">
            {bandwidthInfo?.isOverLimit ? (
              <div className="text-destructive">
                <AlertCircle className="h-4 w-4 inline-block mr-1" />
                You've exceeded your bandwidth limit. Additional usage is charged at ${bandwidthData.overageRate.toFixed(3)} per GB.
              </div>
            ) : bandwidthInfo?.isCloseToLimit ? (
              <div className="text-amber-500">
                <AlertCircle className="h-4 w-4 inline-block mr-1" />
                You're at {bandwidthInfo.usagePercent.toFixed(1)}% of your monthly bandwidth limit.
              </div>
            ) : (
              <div>
                {formatBandwidth(bandwidthInfo?.remaining || 0)} remaining until {new Date(bandwidthData.periodEnd).toLocaleDateString()}
              </div>
            )}
          </div>

          {bandwidthInfo?.isOverLimit && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bandwidth Overage</AlertTitle>
              <AlertDescription>
                Your account will be automatically charged for bandwidth overages at the end of each billing period.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                <span>View Details</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}