import { MobileNavigation } from "@/components/shared/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Edit, Share2, FolderPlus, FileDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AddToCollectionDialog } from "@/components/my-itineraries/AddToCollectionDialog";
import { useItineraryCollections } from "@/hooks/useItineraryCollections";
import { toast } from "sonner";
import { usePDFExport } from "@/hooks/usePDFExport";
import { ItineraryData } from "@/types/itinerary";

interface ItineraryHeaderProps {
  itineraryId: number;
  itineraryData?: ItineraryData | null;
}

export const ItineraryHeader = ({ itineraryId, itineraryData }: ItineraryHeaderProps) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { collections, createCollection, addToCollection } = useItineraryCollections();
  const { exportToPDF, isGenerating } = usePDFExport();

  const handleExportPDF = async () => {
    if (!itineraryData) {
      toast.error('No itinerary data available');
      return;
    }
    await exportToPDF(itineraryData);
  };

  const handleSelectCollection = async (collectionId: string) => {
    await addToCollection(collectionId, [itineraryId]);
    toast.success('Added to collection');
  };

  const handleCreateNew = async (name: string) => {
    const newCollection = await createCollection(name);
    if (newCollection) {
      await addToCollection(newCollection.id, [itineraryId]);
      toast.success('Created collection and added itinerary');
    }
  };

  return (
    <>
      <MobileNavigation 
        travelerLevel="Master Traveler"
        showBackButton={true}
        backPath="/itineraries"
        backLabel="Back to Itineraries"
        showProfileButton={false}
        showTripButtons={false}
        customActions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white transition-all duration-300"
              onClick={handleExportPDF}
              disabled={isGenerating || !itineraryData}
              title="Download PDF"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white transition-all duration-300"
              onClick={() => setDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full bg-white text-[#171821] border-white hover:bg-gradient-to-r hover:from-[hsl(351,85%,75%)] hover:via-[hsl(15,80%,70%)] hover:to-[hsl(25,75%,65%)] hover:text-white transition-all duration-300"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              className="w-9 h-9 sm:w-10 sm:h-10 p-0 rounded-full gold-gradient hover:opacity-90 text-[#171821] font-semibold"
              onClick={() => navigate(`/edit-itinerary?id=${itineraryId}`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <AddToCollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collections={collections}
        onSelectCollection={handleSelectCollection}
        onCreateNew={handleCreateNew}
        itineraryCount={1}
      />
    </>
  );
};