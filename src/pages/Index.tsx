import { BrightLanding } from "@/components/landing/BrightLanding";
import { BrightSections } from "@/components/landing/BrightSections";
import { ChatInterface } from "@/components/chat/ChatInterface";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Bright landing hero + journey scenes (static design source) */}
      <BrightLanding />

      {/* Continuation: lanes, workspace, arrival CTA, footer */}
      <BrightSections />

      <ChatInterface context="travel planning and general travel assistance" />
    </div>
  );
};

export default Index;
