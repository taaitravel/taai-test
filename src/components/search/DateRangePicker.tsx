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
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">Dates *</label>
      <div className="border border-white/20 rounded-lg p-4 bg-white/5">
        <div className="flex items-center gap-3">
          {/* Start Date */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'flex-1 justify-start text-left font-normal bg-white/10 border-white/20',
                  !startDate && 'text-white/60'
                )}
                onClick={() => setSelectingEnd(false)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-xs text-white/60">{startLabel}</span>
                  <span>{startDate ? format(startDate, 'MMM dd') : 'Select'}</span>
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
          <ArrowRight className="h-5 w-5 text-white/40 flex-shrink-0" />

          {/* End Date */}
          <Button
            variant="outline"
            className={cn(
              'flex-1 justify-start text-left font-normal bg-white/10 border-white/20',
              !endDate && 'text-white/60'
            )}
            onClick={() => {
              setSelectingEnd(true);
              setIsOpen(true);
            }}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-xs text-white/60">{endLabel}</span>
              <span>{endDate ? format(endDate, 'MMM dd') : 'Select'}</span>
            </div>
          </Button>
        </div>

        {/* Duration Display */}
        {showNights && nights > 0 && (
          <p className="text-center text-sm text-white/60 mt-2">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </p>
        )}
      </div>
    </div>
  );
};
