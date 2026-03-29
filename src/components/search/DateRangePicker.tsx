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

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">Dates *</label>
      <div className="border border-border rounded-lg p-2 bg-secondary">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-1.5">
          {/* Start Date */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'flex-1 justify-start text-left font-normal bg-background/50 border-border h-auto py-1.5 px-2 hover:bg-accent w-full',
                  !startDate && 'text-muted-foreground'
                )}
                onClick={() => setSelectingEnd(false)}
              >
                <CalendarIcon className={cn("mr-1.5 h-3.5 w-3.5 flex-shrink-0", startDate ? "text-primary" : "text-muted-foreground")} />
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs text-muted-foreground w-[40%] md:w-[25%]">{startLabel}</span>
                  <span className={cn("text-sm w-[60%] md:w-[75%]", startDate ? "text-primary" : "text-foreground")}>{startDate ? format(startDate, 'MMM dd') : 'Select'}</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={startDate && endDate ? { from: startDate, to: endDate } : startDate ? { from: startDate, to: startDate } : undefined}
                onSelect={(range) => {
                  if (range?.from) {
                    if (!selectingEnd) {
                      onStartDateChange(range.from);
                      setSelectingEnd(true);
                    } else if (range?.to) {
                      onEndDateChange(range.to);
                      setIsOpen(false);
                      setSelectingEnd(false);
                    }
                  }
                }}
                initialFocus
                disabled={(date) => date < new Date()}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Arrow */}
          <ArrowRight className="hidden md:block h-3 w-3 text-muted-foreground flex-shrink-0" />

          {/* End Date */}
          <Button
            variant="outline"
            className={cn(
              'flex-1 justify-start text-left font-normal bg-background/50 border-border h-auto py-1.5 px-2 hover:bg-accent w-full',
              !endDate && 'text-muted-foreground'
            )}
            onClick={() => {
              setSelectingEnd(true);
              setIsOpen(true);
            }}
          >
            <CalendarIcon className={cn("mr-1.5 h-3.5 w-3.5 flex-shrink-0", endDate ? "text-primary" : "text-muted-foreground")} />
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground w-[40%] md:w-[25%]">{endLabel}</span>
              <span className={cn("text-sm w-[60%] md:w-[75%]", endDate ? "text-primary" : "text-foreground")}>{endDate ? format(endDate, 'MMM dd') : 'Select'}</span>
            </div>
          </Button>
        </div>

        {/* Duration Display */}
        {showNights && nights > 0 && (
          <p className="text-center text-[10px] text-muted-foreground mt-1.5">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </p>
        )}
      </div>
    </div>
  );
};
