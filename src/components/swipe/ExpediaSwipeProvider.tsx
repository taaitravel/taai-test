import React, { createContext, useContext, ReactNode } from 'react';
import { useExpediaIntegration } from '@/hooks/useExpediaIntegration';
import { HotelSwipeItem, FlightSwipeItem, ActivitySwipeItem } from './types';

interface ExpediaSwipeContextType {
  loading: boolean;
  fetchHotelsForLocation: (location: string, checkin?: string, checkout?: string) => Promise<HotelSwipeItem[]>;
  fetchFlightsForRoute: (origin: string, destination: string, departureDate?: string) => Promise<FlightSwipeItem[]>;
  fetchActivitiesForLocation: (location: string) => Promise<ActivitySwipeItem[]>;
}

const ExpediaSwipeContext = createContext<ExpediaSwipeContextType | null>(null);

interface ExpediaSwipeProviderProps {
  children: ReactNode;
}

export const ExpediaSwipeProvider: React.FC<ExpediaSwipeProviderProps> = ({ children }) => {
  const expediaIntegration = useExpediaIntegration();

  return (
    <ExpediaSwipeContext.Provider value={expediaIntegration}>
      {children}
    </ExpediaSwipeContext.Provider>
  );
};

export const useExpediaSwipe = () => {
  const context = useContext(ExpediaSwipeContext);
  if (!context) {
    throw new Error('useExpediaSwipe must be used within an ExpediaSwipeProvider');
  }
  return context;
};