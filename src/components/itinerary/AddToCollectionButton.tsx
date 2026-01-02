import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddToCollectionDialog } from '@/components/my-itineraries/AddToCollectionDialog';
import { useItineraryCollections } from '@/hooks/useItineraryCollections';
import { toast } from 'sonner';

interface AddToCollectionButtonProps {
  itineraryId: number;
}

export const AddToCollectionButton: React.FC<AddToCollectionButtonProps> = ({
  itineraryId
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { collections, createCollection, addToCollection } = useItineraryCollections();

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
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-white/20 text-white/80 hover:bg-white/10 hover:text-white"
        onClick={() => setDialogOpen(true)}
      >
        <FolderPlus className="h-4 w-4" />
        Add to Collection
      </Button>

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
