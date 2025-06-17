
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";

const Map = () => {
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
      // In a real implementation, you would initialize the Mapbox map here
    }
  };

  if (showTokenInput) {
    return (
      <div className="h-full flex items-center justify-center bg-[#2d2a1f] rounded-lg border border-yellow-500/20">
        <Card className="w-full max-w-md bg-[#171821]/60 border-yellow-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-yellow-200 flex items-center justify-center space-x-2">
              <MapPin className="h-5 w-5 text-yellow-400" />
              <span>Interactive Map</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-yellow-300/70 text-center">
              To display the interactive map, please enter your Mapbox public token. 
              You can get one for free at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300 underline">mapbox.com</a>
            </p>
            <div className="space-y-2">
              <Input
                placeholder="Enter your Mapbox public token..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
              />
              <Button 
                onClick={handleTokenSubmit}
                disabled={!mapboxToken.trim()}
                className="w-full gold-gradient hover:opacity-90 text-[#171821] font-semibold"
              >
                Load Map
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#2d2a1f] rounded-lg border border-yellow-500/20 flex items-center justify-center">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <p className="text-yellow-200 font-medium">Interactive Map</p>
        <p className="text-yellow-300/70 text-sm mt-1">
          Your travel destinations will be displayed here
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-center space-x-2 text-sm text-yellow-300/70">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Paris, France</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-yellow-300/70">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Rome, Italy</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-yellow-300/70">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span>Barcelona, Spain</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
