import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  startLabel: string;
  endLabel: string;
  showNights?: boolean;
}

export const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel,
  endLabel,
  showNights = false,
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const nights = startDate && endDate ? differenceInDays(endDate, startDate) : 0;

  const handleDateSelect = (date: Date | undefined) => {
    if (!selectingEnd) {
      onStartDateChange(date);
      setSelectingEnd(true);
    } else {
      onEndDateChange(date);
      setIsOpen(false);
      setSelectingEnd(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/70">Dates *</label>
      <div className="border border-white/10 rounded-lg p-2 bg-[#1a1c2e]">
        <div className="flex items-center gap-1.5">
          {/* Start Date */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'flex-1 justify-start text-left font-normal bg-white/5 border-white/10 h-auto py-1.5 px-2.5 hover:bg-white/10',
                  !startDate && 'text-white/50'
                )}
                onClick={() => setSelectingEnd(false)}
              >
                <CalendarIcon className="mr-1.5 h-3 w-3 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-white/50 uppercase tracking-wide">{startLabel}</span>
                  <span className="text-xs">{startDate ? format(startDate, 'MMM dd') : 'Select'}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectingEnd ? endDate : startDate}
                onSelect={handleDateSelect}
                initialFocus
                disabled={(date) => date < new Date()}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Arrow */}
          <ArrowRight className="h-3 w-3 text-white/30 flex-shrink-0" />

          {/* End Date */}
          <Button
            variant="outline"
            className={cn(
              'flex-1 justify-start text-left font-normal bg-white/5 border-white/10 h-auto py-1.5 px-2.5 hover:bg-white/10',
              !endDate && 'text-white/50'
            )}
            onClick={() => {
              setSelectingEnd(true);
              setIsOpen(true);
            }}
          >
            <CalendarIcon className="mr-1.5 h-3 w-3 flex-shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-white/50 uppercase tracking-wide">{endLabel}</span>
              <span className="text-xs">{endDate ? format(endDate, 'MMM dd') : 'Select'}</span>
            </div>
          </Button>
        </div>

        {/* Duration Display */}
        {showNights && nights > 0 && (
          <p className="text-center text-[10px] text-white/50 mt-1.5">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </p>
        )}
      </div>
    </div>
  );
};
