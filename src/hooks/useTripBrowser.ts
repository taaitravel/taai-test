import { useState } from "react";

export const useTripBrowser = () => {
  const [showTripBrowser, setShowTripBrowser] = useState(false);
  const [currentTripIndex, setCurrentTripIndex] = useState(0);

  const openTripBrowser = () => setShowTripBrowser(true);
  const closeTripBrowser = () => setShowTripBrowser(false);

  return {
    showTripBrowser,
    currentTripIndex,
    setCurrentTripIndex,
    openTripBrowser,
    closeTripBrowser
  };
};