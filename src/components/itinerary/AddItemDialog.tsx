import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlaceSearch, PlaceResult } from "@/components/inputs/PlaceSearch";
import { Trash2, X, Check } from "lucide-react";

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
  onDelete?: () => void;
  suggestions?: Suggestions;
  defaultCity?: string;
  initialItem?: any | null;
}

export const AddItemDialog: React.FC<AddItemDialogProps> = ({ open, type, onClose, onSubmit, onDelete, suggestions, defaultCity, initialItem }) => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass = "bg-white text-[#171821] border-0 focus-visible:ring-2 focus-visible:ring-primary text-base";

  useEffect(() => {
    if (open && type) {
      // If editing, prefill with existing item
      if (initialItem) {
        setForm(initialItem);
        setErrors({});
        return;
      }
      // Otherwise set defaults per type
      const baseCity = defaultCity || '';
      switch (type) {
        case 'flights':
          setForm({ airline: '', flight_number: '', departure: '', arrival: '', from: baseCity, to: baseCity, cost: '' });
          break;
        case 'hotels':
          setForm({ name: '', city: baseCity, check_in: '', check_out: '', nights: 1, rooms: 1, guests: 2, cost: '', rating: 4, link_url: '', location: null });
          break;
        case 'activities':
          setForm({ name: '', city: baseCity, date: '', cost: '', duration: '', participants: 1, link_url: '', location: null });
          break;
        case 'reservations':
          setForm({ type: 'restaurant', name: '', city: baseCity, date: '', time: '', party_size: 2, cost: '', link_url: '', location: null });
          break;
      }
      setErrors({});
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

  const setSelectedLocation = (place: PlaceResult) => {
    setForm((prev: any) => ({ ...prev, city: place.name, location: place }));
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!type) return false;

    // Common numeric validations
    const numberFields: string[] = [];
    if (type === 'hotels') numberFields.push('cost', 'nights', 'rating', 'rooms', 'guests');
    if (type === 'activities') numberFields.push('cost');
    if (type === 'reservations') numberFields.push('party_size', 'cost');

    numberFields.forEach((f) => {
      const v = form[f];
      if (v !== '' && v !== undefined && isNaN(Number(v))) nextErrors[f] = 'Must be a number';
      if ((f === 'cost' || f === 'party_size' || f === 'nights' || f === 'rating') && Number(v) < 0) nextErrors[f] = 'Must be >= 0';
    });

if (type === 'hotels') {
  if (!form.name) nextErrors.name = 'Hotel name is required';
  if (!form.check_in) nextErrors.check_in = 'Check-in is required';
  if (!form.check_out) nextErrors.check_out = 'Check-out is required';
  if (form.check_in && form.check_out) {
    const start = new Date(form.check_in);
    const end = new Date(form.check_out);
    if (end <= start) nextErrors.check_out = 'Check-out must be after check-in';
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < 1) nextErrors.check_out = 'Minimum 1 night';
  }
  if (!form.location) nextErrors.location = 'Select a location';
}

    if (type === 'reservations') {
      if (!form.name) nextErrors.name = 'Reservation name is required';
      if (!form.type) nextErrors.type = 'Type is required';
      if (!form.date) nextErrors.date = 'Date is required';
      if (!form.time) nextErrors.time = 'Time is required';
      if (!form.location) nextErrors.location = 'Select a location';
    }

    if (type === 'activities') {
      if (!form.name) nextErrors.name = 'Activity name is required';
      if (!form.date) nextErrors.date = 'Date is required';
      if (!form.location && !form.city) nextErrors.location = 'Select a city or location';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!type) return;
    if (!validate()) return;
    setLoading(true);
    try {
      // Normalize numeric fields
      const item = { ...form };
      ['cost', 'nights', 'rating', 'party_size'].forEach((k) => {
        if (k in item && item[k] !== '') item[k] = Number(item[k]);
      });

      // If a location has been chosen, ensure city is set and preserve Expedia data
      if (item.location) {
        if (typeof item.location === 'object') {
          // Store city name for backward compatibility
          item.city = item.city || item.location.name;
          
          // Preserve Expedia-specific fields for hotels and activities
          if (item.location.source === 'expedia') {
            if (item.location.property_id) {
              item.expedia_property_id = item.location.property_id;
            }
            if (item.location.rating) {
              item.rating = item.location.rating;
            }
            if (item.location.price) {
              item.price = item.location.price;
            }
            if (item.location.images && item.location.images.length > 0) {
              item.images = item.location.images;
            }
            if (item.location.description) {
              item.description = item.location.description;
            }
            item.booking_status = 'pending';
          }
          
          // Store location as string for database compatibility
          item.location = item.location.name;
        }
      }

      // For hotels, calculate total cost and nights
      if (type === 'hotels') {
        const start = item.check_in ? new Date(item.check_in) : null;
        const end = item.check_out ? new Date(item.check_out) : null;
        const nights = start && end ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const perNight = Number(item.cost || 0);
        const rooms = Number(item.rooms || 1);
        item.nights = nights;
        item.rooms = rooms;
        item.guests = Number(item.guests || 2);
        item.cost_per_night = perNight;
        item.cost = perNight * Math.max(nights, 0) * rooms;
      }

      // For activities, calculate total group cost
      if (type === 'activities') {
        const participants = Number(item.participants || 1);
        const costPerPerson = Number(item.cost || 0);
        item.participants = participants;
        item.cost_per_person = costPerPerson;
        item.cost = costPerPerson * participants;
      }

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
            <div className="sm:col-span-2">
              <Label htmlFor="name">Hotel name</Label>
              <Input id="name" value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} list="hotels" className={inputClass} />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div className="sm:col-span-2">
              <PlaceSearch id="hotel-location" label="Hotel Search" placeholder="Search hotels by name or location" mode="hotel" onSelect={setSelectedLocation} locationBias={{ city: form.city || defaultCity }} />
              {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
            </div>
<div>
  <Label htmlFor="check_in">Check-in</Label>
  <Input id="check_in" type="date" value={form.check_in || ''} onChange={(e) => { const v = e.target.value; handleChange('check_in', v); if (form.check_out) { const s = new Date(v); const eDate = new Date(form.check_out); const n = Math.ceil((eDate.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)); setForm((prev:any)=>({ ...prev, nights: Math.max(n, 0) })); } }} className={inputClass} />
  {errors.check_in && <p className="text-sm text-red-600 mt-1">{errors.check_in}</p>}
</div>
<div>
  <Label htmlFor="check_out">Check-out</Label>
  <Input id="check_out" type="date" value={form.check_out || ''} onChange={(e) => { const v = e.target.value; handleChange('check_out', v); if (form.check_in) { const s = new Date(form.check_in); const eDate = new Date(v); const n = Math.ceil((eDate.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)); setForm((prev:any)=>({ ...prev, nights: Math.max(n, 0) })); } }} className={inputClass} />
  {errors.check_out && <p className="text-sm text-red-600 mt-1">{errors.check_out}</p>}
</div>
            <div>
              <Label htmlFor="rating">Rating</Label>
              <Input id="rating" type="number" min="1" max="5" value={form.rating || 4} onChange={(e) => handleChange('rating', e.target.value)} className={inputClass} />
            </div>
<div>
  <Label htmlFor="cost">Cost per night (USD)</Label>
  <Input id="cost" type="number" min="0" value={form.cost || ''} onChange={(e) => handleChange('cost', e.target.value)} className={inputClass} />
</div>
            <div>
              <Label htmlFor="rooms">Rooms</Label>
              <Input id="rooms" type="number" min="1" value={form.rooms || 1} onChange={(e) => handleChange('rooms', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="guests">Guests</Label>
              <Input id="guests" type="number" min="1" value={form.guests || 2} onChange={(e) => handleChange('guests', e.target.value)} className={inputClass} />
            </div>
            {form.cost && form.check_in && form.check_out && (
              <div className="sm:col-span-2 p-2 bg-primary/10 rounded text-sm text-center">
                Total: ${(Number(form.cost || 0) * Math.max(form.nights || 0, 0) * Number(form.rooms || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({form.nights} nights × {form.rooms || 1} room{Number(form.rooms || 1) > 1 ? 's' : ''})
              </div>
            )}
            <div className="sm:col-span-2">
              <Label htmlFor="link_url">Hotel link (optional)</Label>
              <Input id="link_url" placeholder="https://..." value={form.link_url || ''} onChange={(e) => handleChange('link_url', e.target.value)} className={inputClass} />
            </div>
          </div>
        );
      case 'activities':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Activity name</Label>
              <Input id="name" value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} list="activities" className={inputClass} />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div className="sm:col-span-2">
              <PlaceSearch id="activity-location" label="Activity Search" placeholder="Search activities and attractions" mode="activity" onSelect={setSelectedLocation} locationBias={{ city: form.city || defaultCity }} />
              {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date || ''} onChange={(e) => handleChange('date', e.target.value)} className={inputClass} />
              {errors.date && <p className="text-sm text-red-600 mt-1">{errors.date}</p>}
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" placeholder="e.g., 3h 30m" value={form.duration || ''} onChange={(e) => handleChange('duration', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="cost">Cost per person (USD)</Label>
              <Input id="cost" type="number" min="0" value={form.cost || ''} onChange={(e) => handleChange('cost', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="participants">Participants</Label>
              <Input id="participants" type="number" min="1" value={form.participants || 1} onChange={(e) => handleChange('participants', e.target.value)} className={inputClass} />
            </div>
            {form.cost && Number(form.participants || 1) > 0 && (
              <div className="sm:col-span-2 p-2 bg-primary/10 rounded text-sm text-center">
                Total: ${(Number(form.cost || 0) * Number(form.participants || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })} ({form.participants || 1} participant{Number(form.participants || 1) > 1 ? 's' : ''})
              </div>
            )}
            <div className="sm:col-span-2">
              <Label htmlFor="link_url">Link to activity (optional)</Label>
              <Input id="link_url" placeholder="https://..." value={form.link_url || ''} onChange={(e) => handleChange('link_url', e.target.value)} className={inputClass} />
            </div>
          </div>
        );
      case 'reservations':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Reservation name</Label>
              <Input id="name" value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input id="type" value={form.type || 'restaurant'} onChange={(e) => handleChange('type', e.target.value)} list="reservation-types" className={inputClass} />
              <datalist id="reservation-types">
                <option value="restaurant" />
                <option value="conference" />
                <option value="meeting" />
                <option value="event" />
                <option value="tour" />
                <option value="show" />
                <option value="other" />
              </datalist>
              {errors.type && <p className="text-sm text-red-600 mt-1">{errors.type}</p>}
            </div>
            <div className="sm:col-span-2">
              <PlaceSearch id="reservation-location" label="Location" placeholder="Search venue or restaurant" mode={form.type === 'restaurant' ? 'restaurant' : 'poi'} onSelect={setSelectedLocation} locationBias={{ city: form.city || defaultCity }} />
              {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={form.date || ''} onChange={(e) => handleChange('date', e.target.value)} className={inputClass} />
              {errors.date && <p className="text-sm text-red-600 mt-1">{errors.date}</p>}
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="time" value={form.time || ''} onChange={(e) => handleChange('time', e.target.value)} className={inputClass} />
              {errors.time && <p className="text-sm text-red-600 mt-1">{errors.time}</p>}
            </div>
            <div>
              <Label htmlFor="party_size">Party size</Label>
              <Input id="party_size" type="number" min="1" value={form.party_size || 2} onChange={(e) => handleChange('party_size', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label htmlFor="cost">Estimated Cost (USD)</Label>
              <Input id="cost" type="number" min="0" placeholder="e.g., 150" value={form.cost || ''} onChange={(e) => handleChange('cost', e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="link_url">Link (optional)</Label>
              <Input id="link_url" placeholder="https://..." value={form.link_url || ''} onChange={(e) => handleChange('link_url', e.target.value)} className={inputClass} />
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg gold-gradient text-[#171821] text-base max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-base">
            Fill in the details below to add to your itinerary.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
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
        </div>

        <DialogFooter className="mt-4 flex justify-between items-center flex-shrink-0 border-t border-black/10 pt-4">
          {initialItem && onDelete && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                if (confirm('Are you sure you want to delete this item?')) {
                  onDelete();
                  onClose();
                }
              }} 
              disabled={loading}
              className="h-10 w-10 bg-red-500 hover:bg-red-600 text-black border-0"
              aria-label="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose} 
              disabled={loading}
              className="h-10 w-10 bg-white hover:bg-white/90 text-[#171821] border-0"
              aria-label="Cancel"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button 
              variant="contrast" 
              size="icon"
              onClick={handleSubmit} 
              disabled={loading || !type}
              className="h-10 w-10 hover:text-green-700 transition-colors"
              aria-label="Save"
            >
              <Check className="h-5 w-5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
