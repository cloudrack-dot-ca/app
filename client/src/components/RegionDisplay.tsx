
import React from 'react';

interface RegionDisplayProps {
  region: string;
  className?: string;
}

const RegionDisplay: React.FC<RegionDisplayProps> = ({ region, className = '' }) => {
  // Map of region codes to human-readable names
  const regionNames: Record<string, string> = {
    'nyc1': 'New York City',
    'nyc3': 'New York City',
    'sfo3': 'San Francisco',
    'ams3': 'Amsterdam',
    'sgp1': 'Singapore',
    'lon1': 'London',
    'fra1': 'Frankfurt',
    'tor1': 'Toronto',
    'blr1': 'Bangalore',
    // Add more region mappings as needed
  };

  const displayName = regionNames[region] || region;
  
  return (
    <span className={className}>
      {displayName}
    </span>
  );
};

export default RegionDisplay;
