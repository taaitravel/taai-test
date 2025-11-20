import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useItineraryMatcher } from '@/hooks/useItineraryMatcher';
import { Input } from '@/components/ui/input';

interface ItineraryMatcherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchDates: { checkin: string; checkout: string };
  item: any;
  onConfirm: (itineraryId: string | 'new', newItineraryName?: string, startDate?: string, endDate?: string) => void;
}

export const ItineraryMatcherModal = ({
  open,
  onOpenChange,
  searchDates,
  item,
  onConfirm,
}: ItineraryMatcherModalProps) => {
  const { findMatchingItineraries } = useItineraryMatcher();
  const [matchingItineraries, setMatchingItineraries] = useState<any[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<string>('new');
  const [newItineraryName, setNewItineraryName] = useState('');
  const [newItineraryStartDate, setNewItineraryStartDate] = useState(searchDates.checkin);
  const [newItineraryEndDate, setNewItineraryEndDate] = useState(searchDates.checkout);

  useEffect(() => {
    setNewItineraryStartDate(searchDates.checkin);
    setNewItineraryEndDate(searchDates.checkout);
  }, [searchDates]);

  useEffect(() => {
    if (open && searchDates.checkin && searchDates.checkout) {
      findMatchingItineraries(searchDates).then(setMatchingItineraries);
    }
  }, [open, searchDates]);

  const handleConfirm = () => {
    if (selectedItinerary === 'new') {
      if (!newItineraryName.trim()) {
        return; // Don't allow empty names
      }
      onConfirm('new', newItineraryName, newItineraryStartDate, newItineraryEndDate);
    } else {
      onConfirm(selectedItinerary);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#171821] border-white/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add {item?.name || 'Item'} to...</DialogTitle>
          <DialogDescription className="text-white/70">
            Choose an existing itinerary or create a new one
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={selectedItinerary} onValueChange={setSelectedItinerary}>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {/* Matching Itineraries */}
            {matchingItineraries.map((itin) => (
              <div
                key={itin.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  selectedItinerary === itin.id.toString()
                    ? 'bg-white/10 border-primary'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <RadioGroupItem value={itin.id.toString()} id={itin.id.toString()} />
                <Label
                  htmlFor={itin.id.toString()}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{itin.itin_name}</p>
                    {itin.matchType === 'exact' ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-white/60 mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(itin.itin_date_start).toLocaleDateString()} -{' '}
                    {new Date(itin.itin_date_end).toLocaleDateString()}
                  </div>
                  {itin.matchType === 'partial' && (
                    <p className="text-xs text-yellow-400 mt-1">Dates overlap partially</p>
                  )}
                </Label>
              </div>
            ))}

            {/* Create New Option */}
            <div
              className={`flex items-start space-x-3 p-3 rounded-lg border ${
                selectedItinerary === 'new'
                  ? 'bg-white/10 border-primary'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <p className="font-semibold text-white">Create New Itinerary</p>
                </div>
                {selectedItinerary === 'new' && (
                  <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <Label htmlFor="trip-name" className="text-white/70 text-sm">
                        Trip Name *
                      </Label>
                      <Input
                        id="trip-name"
                        value={newItineraryName}
                        onChange={(e) => setNewItineraryName(e.target.value)}
                        placeholder="e.g., Summer Vacation 2025"
                        className="mt-1 bg-[#1f1f27] border-white/30 text-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="start-date" className="text-white/70 text-sm">
                          Start Date *
                        </Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={newItineraryStartDate}
                          onChange={(e) => setNewItineraryStartDate(e.target.value)}
                          className="mt-1 bg-[#1f1f27] border-white/30 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date" className="text-white/70 text-sm">
                          End Date *
                        </Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={newItineraryEndDate}
                          onChange={(e) => setNewItineraryEndDate(e.target.value)}
                          min={newItineraryStartDate}
                          className="mt-1 bg-[#1f1f27] border-white/30 text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Label>
            </div>
          </div>
        </RadioGroup>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedItinerary === 'new' && !newItineraryName.trim()}
            className="flex-1 gold-gradient hover:opacity-90 text-[#171821] font-semibold disabled:opacity-50"
          >
            Add to Selected
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
