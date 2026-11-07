import { useState } from "react";
import { travelerLevelFromProfile } from "@/lib/travelerLevel";
import { useDashboardData, type SortOption } from "@/hooks/useDashboardData";
import { useTripBrowser } from "@/hooks/useTripBrowser";
import { calculateUserStats } from "@/lib/dashboardUtils";
import { localDateOnlyFromDate } from "@/lib/date-time";

export const useDashboard = () => {
  // Filter state
  const [sortBy, setSortBy] = useState<SortOption>('start_date');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const { activeItineraries, loading, userProfile } = useDashboardData({
    sortBy,
    dateFrom: dateFrom ? localDateOnlyFromDate(dateFrom) : undefined,
    dateTo: dateTo ? localDateOnlyFromDate(dateTo) : undefined,
  });

  const { 
    showTripBrowser, 
    currentTripIndex, 
    setCurrentTripIndex, 
    openTripBrowser, 
    closeTripBrowser 
  } = useTripBrowser();

  const userStats = calculateUserStats(activeItineraries, userProfile);
  const fullUserStats = {
    ...userStats,
    travelerLevel: travelerLevelFromProfile(userProfile),
  };

  // Filter handlers
  const handleClearFilters = () => {
    setSortBy('start_date');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
  };

  const handleDateFromChange = (date?: Date) => {
    setDateFrom(date);
  };

  const handleDateToChange = (date?: Date) => {
    setDateTo(date);
  };

  return {
    // Data
    activeItineraries,
    loading,
    userProfile,
    fullUserStats,
    visitedCountries: userStats.visitedCountries,
    
    // Trip browser state
    showTripBrowser,
    currentTripIndex,
    setCurrentTripIndex,
    openTripBrowser,
    closeTripBrowser,
    
    // Filter state
    sortBy,
    dateFrom,
    dateTo,
    
    // Filter handlers
    handleClearFilters,
    handleSortChange,
    handleDateFromChange,
    handleDateToChange,
  };
};