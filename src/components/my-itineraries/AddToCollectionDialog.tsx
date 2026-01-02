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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNew();
                  if (e.key === 'Escape') setShowNewInput(false);
                }}
              />
              <Button onClick={handleCreateNew} disabled={!newName.trim() || saving}>
                Add
              </Button>
              <Button variant="ghost" onClick={() => setShowNewInput(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
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
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    onClick={() => handleSelect(collection.id)}
                    disabled={saving}
                  >
                    <Folder className="h-5 w-5 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {collection.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {collection.itinerary_count || 0} itinerary{(collection.itinerary_count || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {selectedId === collection.id && (
                      <Check className="h-5 w-5 text-primary animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {collections.length === 0 && !showNewInput && (
            <p className="text-center text-muted-foreground py-4">
              No collections yet. Create one to get started!
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
