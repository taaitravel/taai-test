import { useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Paperclip, Image, Calendar, Plane, Building2, MapPin, Utensils } from 'lucide-react';
import { ItineraryData } from '@/types/itinerary';

interface ChatAttachmentPickerProps {
  itineraryData: ItineraryData;
  onImageSelected: (file: File) => void;
  onCardSelected: (category: string, item: any) => void;
  onCalendarSelected: (date: string) => void;
}

const categoryConfig = [
  { key: 'flights', label: 'Flight', icon: Plane },
  { key: 'hotels', label: 'Hotel', icon: Building2 },
  { key: 'activities', label: 'Activity', icon: MapPin },
  { key: 'reservations', label: 'Reservation', icon: Utensils },
];

export const ChatAttachmentPicker = ({
  itineraryData,
  onImageSelected,
  onCardSelected,
  onCalendarSelected,
}: ChatAttachmentPickerProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageSelected(file);
    e.target.value = '';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground">
          <Paperclip className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2" side="top">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <button
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Image className="h-4 w-4 text-primary" />
          Upload Photo
        </button>

        <div className="border-t border-border my-1" />
        <p className="text-[10px] text-muted-foreground px-3 py-1 uppercase tracking-wider">Share from trip</p>

        {categoryConfig.map(({ key, label, icon: Icon }) => {
          const items = ((itineraryData as any)[key] || []) as any[];
          if (items.length === 0) return null;
          return (
            <Popover key={key}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                  {label} ({items.length})
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-52 p-1 max-h-60 overflow-y-auto">
                {items.map((item: any, i: number) => (
                  <button
                    key={i}
                    className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-muted truncate"
                    onClick={() => onCardSelected(key, item)}
                  >
                    {item.name || item.airline || `${label} ${i + 1}`}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          );
        })}

        <div className="border-t border-border my-1" />
        {itineraryData.itin_date_start && (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            onClick={() => onCalendarSelected(itineraryData.itin_date_start || '')}
          >
            <Calendar className="h-4 w-4 text-primary" />
            Share Trip Date
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};
