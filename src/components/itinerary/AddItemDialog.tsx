import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ItemType = 'flights' | 'hotels' | 'activities' | 'reservations';

interface Suggestions {
  cities?: string[];
  airlines?: string[];
  hotels?: string[];
  activities?: string[];
  cuisines?: string[];
}

interface AddItemDialogProps {
  open: boolean;
  type: ItemType | null;
  onClose: () => void;
  onSubmit: (type: ItemType, item: any) => Promise<void>;
  suggestions?: Suggestions;
  defaultCity?: string;
  initialItem?: any | null;
}

export const AddItemDialog: React.FC<AddItemDialogProps> = ({ open, type, onClose, onSubmit, suggestions, defaultCity, initialItem }) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({});

  const inputClass = "bg-white text-[#171821] border-0 focus-visible:ring-2 focus-visible:ring-primary";

  useEffect(() => {
    if (open && type) {
      // If editing, prefill with existing item
      if (initialItem) {
        setForm(initialItem);
        return;
      }
      // Otherwise set defaults per type
      const baseCity = defaultCity || '';
      switch (type) {
        case 'flights':
          setForm({ airline: '', flight_number: '', departure: '', arrival: '', from: baseCity, to: baseCity, cost: '' });
          break;
        case 'hotels':
          setForm({ name: '', city: baseCity, check_in: '', check_out: '', nights: 1, cost: '', rating: 4 });
          break;
        case 'activities':
          setForm({ name: '', city: baseCity, date: '', cost: '', duration: '' });
          break;
        case 'reservations':
          setForm({ type: 'restaurant', name: '', city: baseCity, date: '', time: '', party_size: 2 });
          break;
      }
    }
  }, [open, type, defaultCity, initialItem]);

  const title = useMemo(() => {
    if (!type) return '';
    const verb = initialItem ? 'Edit' : 'Add';
    const singular =
      type === 'activities'
        ? 'Activity'
        : (type.endsWith('s') ? type.slice(0, -1) : type);
    return `${verb} ${singular.charAt(0).toUpperCase()}${singular.slice(1)}`;
  }, [type, initialItem]);

  const handleChange = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!type) return;
    setLoading(true);
    try {
      // Normalize numeric fields
      const item = { ...form };
      ['cost', 'nights', 'rating', 'party_size'].forEach((k) => {
        if (k in item && item[k] !== '') item[k] = Number(item[k]);
      });
      await onSubmit(type, item);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Render fields based on type
  const renderFields = () => {
    if (!type) return null;
    switch (type) {
      case 'flights':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="airline">Airline</Label>
              <Input id="airline" value={form.airline || ''} onChange={(e) => handleChange('airline', e.target.value)} list="airlines" className={inputClass} />
              <datalist id="airlines">
                {(suggestions?.airlines || []).map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="flight_number">Flight number</Label>
              <Input id="flight_number" value={form.flight_number || ''} onChange={(e) => handleChange('flight_number', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="from">From</Label>
              <Input id="from" value={form.from || ''} onChange={(e) => handleChange('from', e.target.value)} list="cities" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="to">To</Label>
              <Input id="to" value={form.to || ''} onChange={(e) => handleChange('to', e.target.value)} list="cities" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="departure">Departure</Label>
              <Input id="departure" type="datetime-local" value={form.departure || ''} onChange={(e) => handleChange('departure', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="arrival">Arrival</Label>
              <Input id="arrival" type="datetime-local" value={form.arrival || ''} onChange={(e) => handleChange('arrival', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="cost">Cost (USD)</Label>
              <Input id="cost" type="number" min="0" value={form.cost || ''} onChange={(e) => handleChange('cost', e.target.value)} className={inputClass} />
            </div>
          </div>
        );
      case 'hotels':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Hotel name</Label>
              <Input id="name" value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} list="hotels" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city || ''} onChange={(e) => handleChange('city', e.target.value)} list="cities" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="check_in">Check-in</Label>
              <Input id="check_in" type="date" value={form.check_in || ''} onChange={(e) => handleChange('check_in', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="check_out">Check-out</Label>
              <Input id="check_out" type="date" value={form.check_out || ''} onChange={(e) => handleChange('check_out', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="nights">Nights</Label>
              <Input id="nights" type="number" min="1" value={form.nights || 1} onChange={(e) => handleChange('nights', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="rating">Rating</Label>
              <Input id="rating" type="number" min="1" max="5" value={form.rating || 4} onChange={(e) => handleChange('rating', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="cost">Cost (USD)</Label>
              <Input id="cost" type="number" min="0" value={form.cost || ''} onChange={(e) => handleChange('cost', e.target.value)} className={inputClass} />
            </div>
          </div>
        );
      case 'activities':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Activity name</Label>
              <Input id="name" value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} list="activities" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city || ''} onChange={(e) => handleChange('city', e.target.value)} list="cities" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date || ''} onChange={(e) => handleChange('date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" placeholder="e.g., 3h 30m" value={form.duration || ''} onChange={(e) => handleChange('duration', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="cost">Cost (USD)</Label>
              <Input id="cost" type="number" min="0" value={form.cost || ''} onChange={(e) => handleChange('cost', e.target.value)} className={inputClass} />
            </div>
          </div>
        );
      case 'reservations':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Reservation name</Label>
              <Input id="name" value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input id="type" value={form.type || 'restaurant'} onChange={(e) => handleChange('type', e.target.value)} list="reservation-types" className={inputClass} />
              <datalist id="reservation-types">
                <option value="restaurant" />
                <option value="meeting" />
                <option value="event" />
              </datalist>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city || ''} onChange={(e) => handleChange('city', e.target.value)} list="cities" className={inputClass} />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date || ''} onChange={(e) => handleChange('date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={form.time || ''} onChange={(e) => handleChange('time', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="party_size">Party size</Label>
              <Input id="party_size" type="number" min="1" value={form.party_size || 2} onChange={(e) => handleChange('party_size', e.target.value)} className={inputClass} />
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg gold-gradient text-[#171821]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Fill in the details below to add to your itinerary.
          </DialogDescription>
        </DialogHeader>

        {/* Shared datalists for suggestions */}
        <datalist id="cities">
          {(suggestions?.cities || []).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="hotels">
          {(suggestions?.hotels || []).map((h) => (
            <option key={h} value={h} />
          ))}
        </datalist>
        <datalist id="activities">
          {(suggestions?.activities || []).map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>

        {renderFields()}

        <DialogFooter className="mt-6">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="contrast" onClick={handleSubmit} disabled={loading || !type}>{loading ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
