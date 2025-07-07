import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react";
import type { SortOption } from "@/hooks/useDashboardData";

interface TripsFilterProps {
  sortBy: SortOption;
  dateFrom?: Date;
  dateTo?: Date;
  onSortChange: (sort: SortOption) => void;
  onDateFromChange: (date?: Date) => void;
  onDateToChange: (date?: Date) => void;
  onClearFilters: () => void;
}

export const TripsFilter = ({
  sortBy,
  dateFrom,
  dateTo,
  onSortChange,
  onDateFromChange,
  onDateToChange,
  onClearFilters
}: TripsFilterProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const hasActiveFilters = dateFrom || dateTo || sortBy !== 'start_date';

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Your Trips</h2>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="border-white/30 text-white hover:bg-white/10"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter & Sort
            {hasActiveFilters && (
              <Badge className="ml-2 bg-primary/20 text-primary border-primary/30 text-xs">
                Active
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {isFilterOpen && (
        <Card className="mt-4 bg-white/10 backdrop-blur-md border-white/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sort By */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
                  <SelectTrigger className="bg-white/10 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start_date">Trip Start Date</SelectItem>
                    <SelectItem value="end_date">Trip End Date</SelectItem>
                    <SelectItem value="created_at">Date Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/10 border-white/30 text-white hover:bg-white/15",
                        !dateFrom && "text-white/50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={onDateFromChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/10 border-white/30 text-white hover:bg-white/15",
                        !dateTo && "text-white/50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={onDateToChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};