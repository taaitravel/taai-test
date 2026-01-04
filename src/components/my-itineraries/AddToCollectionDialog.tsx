import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Folder, Check } from 'lucide-react';
import { Collection } from '@/hooks/useItineraryCollections';

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  onSelectCollection: (collectionId: string) => Promise<void>;
  onCreateNew: (name: string) => Promise<void>;
  itineraryCount: number;
}

export const AddToCollectionDialog: React.FC<AddToCollectionDialogProps> = ({
  open,
  onOpenChange,
  collections,
  onSelectCollection,
  onCreateNew,
  itineraryCount
}) => {
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = async (collectionId: string) => {
    setSaving(true);
    setSelectedId(collectionId);
    try {
      await onSelectCollection(collectionId);
      onOpenChange(false);
    } finally {
      setSaving(false);
      setSelectedId(null);
    }
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) return;
    
    setSaving(true);
    try {
      await onCreateNew(newName.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
      setNewName('');
      setShowNewInput(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-[#12131a] border-[#ffce87]/30">
        <DialogHeader>
          <DialogTitle className="text-white">
            Add {itineraryCount} itinerary{itineraryCount !== 1 ? 's' : ''} to collection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {showNewInput ? (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name..."
                autoFocus
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#ffce87]/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNew();
                  if (e.key === 'Escape') setShowNewInput(false);
                }}
              />
              <Button 
                onClick={handleCreateNew} 
                disabled={!newName.trim() || saving}
                className="bg-[#ffce87] text-[#12131a] hover:bg-[#ffce87]/80"
              >
                Add
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowNewInput(false)}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-[#ffce87]/40 text-[#ffce87] hover:bg-[#ffce87]/10 hover:border-[#ffce87]/60"
              onClick={() => setShowNewInput(true)}
            >
              <Plus className="h-4 w-4" />
              Create new collection
            </Button>
          )}

          {collections.length > 0 && (
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left"
                    onClick={() => handleSelect(collection.id)}
                    disabled={saving}
                  >
                    <Folder className="h-5 w-5 text-[#ffce87]" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {collection.name}
                      </p>
                      <p className="text-xs text-[#ffce87]/70">
                        {collection.itinerary_count || 0} itinerary{(collection.itinerary_count || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {selectedId === collection.id && (
                      <Check className="h-5 w-5 text-[#ffce87] animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {collections.length === 0 && !showNewInput && (
            <p className="text-center text-white/50 py-4">
              No collections yet. Create one to get started!
            </p>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
