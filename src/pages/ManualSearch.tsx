import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { UnifiedSearchInterface } from '@/components/search/UnifiedSearchInterface';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hotel, Plane, Activity, Package } from 'lucide-react';

const ManualSearch = () => {
  const [searchType, setSearchType] = useState<'hotel' | 'flight' | 'activity' | 'package'>('hotel');

  return (
    <div className="min-h-screen bg-[#171821]">
      <DashboardLayout />
      <div className="min-h-screen bg-[#171821] p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Search Travel Options</h1>
            <p className="text-white/60">Find and add hotels, flights, and activities to your itinerary</p>
          </div>

          {/* Search Type Tabs */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm mb-6">
            <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)} className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-white/5">
                <TabsTrigger value="hotel" className="flex items-center gap-2">
                  <Hotel className="h-4 w-4" />
                  <span className="hidden sm:inline">Hotels</span>
                </TabsTrigger>
                <TabsTrigger value="flight" className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  <span className="hidden sm:inline">Flights</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Activities</span>
                </TabsTrigger>
                <TabsTrigger value="package" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Packages</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hotel">
                <UnifiedSearchInterface searchType="hotel" />
              </TabsContent>

              <TabsContent value="flight">
                <UnifiedSearchInterface searchType="flight" />
              </TabsContent>

              <TabsContent value="activity">
                <UnifiedSearchInterface searchType="activity" />
              </TabsContent>

              <TabsContent value="package">
                <UnifiedSearchInterface searchType="package" />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManualSearch;
