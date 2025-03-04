
import React from 'react';

// Map region slugs to country codes for flags
const regionToCountry: Record<string, string> = {
  'nyc1': 'us',
  'nyc3': 'us',
  'sfo1': 'us',
  'sfo2': 'us',
  'sfo3': 'us',
  'tor1': 'ca',
  'ams2': 'nl',
  'ams3': 'nl',
  'fra1': 'de',
  'lon1': 'gb',
  'sgp1': 'sg',
  'blr1': 'in',
  'syd1': 'au'
};

// Map region slugs to human-readable names
const regionNames: Record<string, string> = {
  'nyc1': 'New York 1',
  'nyc3': 'New York 3',
  'sfo1': 'San Francisco 1',
  'sfo2': 'San Francisco 2',
  'sfo3': 'San Francisco 3',
  'tor1': 'Toronto',
  'ams2': 'Amsterdam 2',
  'ams3': 'Amsterdam 3',
  'fra1': 'Frankfurt',
  'lon1': 'London',
  'sgp1': 'Singapore',
  'blr1': 'Bangalore',
  'syd1': 'Sydney'
};

interface RegionDisplayProps {
  regionSlug: string;
  showName?: boolean;
}

const RegionDisplay: React.FC<RegionDisplayProps> = ({ regionSlug, showName = true }) => {
  const countryCode = regionToCountry[regionSlug] || 'unknown';
  const regionName = regionNames[regionSlug] || regionSlug;
  
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-4 inline-block">
        {countryCode !== 'unknown' && (
          <img 
            src={`https://hatscripts.github.io/circle-flags/flags/${countryCode}.svg`} 
            alt={`${regionName} flag`}
            className="w-full h-full object-cover rounded-sm"
          />
        )}
      </span>
      {showName && <span>{regionName}</span>}
    </div>
  );
};

export default RegionDisplay;
