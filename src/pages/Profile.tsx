import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPen, Settings, Compass } from "lucide-react";
import { MobileNavigation } from "@/components/shared/MobileNavigation";
import { EditProfileSection } from "@/components/profile/EditProfileSection";
import { PreferencesSection } from "@/components/profile/PreferencesSection";

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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <MobileNavigation
        showBackButton={true}
        backPath="/home"
        backLabel="← Back"
        showTripButtons={false}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="edit" className="gap-2">
              <UserPen className="h-4 w-4" />
              Edit Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="setup" className="gap-2">
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
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
