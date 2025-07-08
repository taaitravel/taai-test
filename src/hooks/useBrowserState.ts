import { useState } from "react";
import { BrowserState } from "@/types/itinerary";

export const useBrowserState = () => {
  const [browserState, setBrowserState] = useState<BrowserState>({
    flightBrowserOpen: false,
    hotelBrowserOpen: false,
    activityBrowserOpen: false,
    reservationBrowserOpen: false,
    currentFlightIndex: 0,
    currentHotelIndex: 0,
    currentActivityIndex: 0,
    currentReservationIndex: 0,
  });

  const openFlightBrowser = (index: number) => {
    setBrowserState(prev => ({
      ...prev,
      currentFlightIndex: index,
      flightBrowserOpen: true
    }));
  };

  const openHotelBrowser = (index: number) => {
    setBrowserState(prev => ({
      ...prev,
      currentHotelIndex: index,
      hotelBrowserOpen: true
    }));
  };

  const openActivityBrowser = (index: number) => {
    setBrowserState(prev => ({
      ...prev,
      currentActivityIndex: index,
      activityBrowserOpen: true
    }));
  };

  const openReservationBrowser = (index: number) => {
    setBrowserState(prev => ({
      ...prev,
      currentReservationIndex: index,
      reservationBrowserOpen: true
    }));
  };

  const closeFlightBrowser = () => {
    setBrowserState(prev => ({ ...prev, flightBrowserOpen: false }));
  };

  const closeHotelBrowser = () => {
    setBrowserState(prev => ({ ...prev, hotelBrowserOpen: false }));
  };

  const closeActivityBrowser = () => {
    setBrowserState(prev => ({ ...prev, activityBrowserOpen: false }));
  };

  const closeReservationBrowser = () => {
    setBrowserState(prev => ({ ...prev, reservationBrowserOpen: false }));
  };

  const setCurrentFlightIndex = (index: number) => {
    setBrowserState(prev => ({ ...prev, currentFlightIndex: index }));
  };

  const setCurrentHotelIndex = (index: number) => {
    setBrowserState(prev => ({ ...prev, currentHotelIndex: index }));
  };

  const setCurrentActivityIndex = (index: number) => {
    setBrowserState(prev => ({ ...prev, currentActivityIndex: index }));
  };

  const setCurrentReservationIndex = (index: number) => {
    setBrowserState(prev => ({ ...prev, currentReservationIndex: index }));
  };

  return {
    browserState,
    openFlightBrowser,
    openHotelBrowser,
    openActivityBrowser,
    openReservationBrowser,
    closeFlightBrowser,
    closeHotelBrowser,
    closeActivityBrowser,
    closeReservationBrowser,
    setCurrentFlightIndex,
    setCurrentHotelIndex,
    setCurrentActivityIndex,
    setCurrentReservationIndex,
  };
};