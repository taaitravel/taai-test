import { BrightLanding } from "@/components/landing/BrightLanding";
import { BrightSections } from "@/components/landing/BrightSections";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { ChatInterface } from "@/components/chat/ChatInterface";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Bright landing hero + journey scenes (static design source) */}
      <BrightLanding />

      {/* Continuation: lanes, workspace, arrival CTA */}
      <BrightSections />

      {/* Global public footer — always the very bottom of the page */}
      <PublicFooter />

      <ChatInterface context="travel planning and general travel assistance" />
    </div>
  );
};

export default Index;
