import React from 'react';
import { Map } from './Map';

// Test component with hardcoded locations to verify map works
export const MapTest = () => {
  const testLocations = [
    {
      city: "Barcelona, Spain",
      lat: 41.3851,
      lng: 2.1734,
      category: 'activity' as const
    },
    {
      city: "Madrid, Spain", 
      lat: 40.4168,
      lng: -3.7038,
      category: 'hotel' as const
    },
    {
      city: "Lisbon, Portugal",
      lat: 38.7223,
      lng: -9.1393,
      category: 'reservation' as const
    }
  ];

  console.log('🧪 MapTest component rendering with test data:', testLocations);

  return (
    <div className="w-full h-[400px] bg-[#171821] rounded-lg p-4">
      <h3 className="text-white mb-4">Map Test Component</h3>
      <div className="h-[300px]">
        <Map locations={testLocations} />
      </div>
    </div>
  );
};