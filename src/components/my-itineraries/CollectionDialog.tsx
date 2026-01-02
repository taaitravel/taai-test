import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collection } from '@/hooks/useItineraryCollections';

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection?: Collection | null;
  onSave: (name: string, description?: string) => Promise<void>;
  onDelete?: (deleteItineraries: boolean) => Promise<void>;
}

export const CollectionDialog: React.FC<CollectionDialogProps> = ({
  open,
  onOpenChange,
  collection,
  onSave,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!collection;

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setDescription(collection.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setShowDeleteConfirm(false);
  }, [collection, open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim() || undefined);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deleteItineraries: boolean) => {
    if (!onDelete) return;
    
    setSaving(true);
    try {
      await onDelete(deleteItineraries);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Collection' : 'Create Collection'}
          </DialogTitle>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              What would you like to do with the itineraries in this collection?
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleDelete(false)}
                disabled={saving}
              >
                Keep itineraries (remove from collection only)
              </Button>
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={() => handleDelete(true)}
                disabled={saving}
              >
                Delete itineraries along with collection
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Europe 2026, Spain Adventures"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for this collection..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {isEditing && onDelete && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={saving}
                  className="sm:mr-auto"
                >
                  Delete Collection
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!name.trim() || saving}
              >
                {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
