import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPen, Settings, Compass, Bell, Map } from "lucide-react";
import { ProfileTripsSection } from "@/components/profile/ProfileTripsSection";
import { MobileNavigation } from "@/components/shared/MobileNavigation";
import { EditProfileSection } from "@/components/profile/EditProfileSection";
import { PreferencesSection } from "@/components/profile/PreferencesSection";
import { NotificationPreferencesSection } from "@/components/profile/NotificationPreferencesSection";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get("tab") || "edit";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (value: string) => {
    if (value === "setup") {
      navigate("/profile-setup");
      return;
    }
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-0">
      <MobileNavigation
        showBackButton={true}
        backPath="/home"
        backLabel="← Back"
        showTripButtons={false}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6 flex w-full gap-1 overflow-x-auto no-scrollbar justify-start rounded-2xl h-auto p-1">
            <TabsTrigger value="edit" className="shrink-0 gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs sm:text-sm">
              <UserPen className="h-4 w-4" />
              Edit Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="shrink-0 gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs sm:text-sm">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="notifications" className="shrink-0 gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs sm:text-sm">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="setup" className="shrink-0 gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs sm:text-sm">
              <Compass className="h-4 w-4" />
              Traveler Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <EditProfileSection />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesSection />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationPreferencesSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
