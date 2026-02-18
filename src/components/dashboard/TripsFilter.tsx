import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X, FolderOpen } from "lucide-react";
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
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Your Trips</h2>
          <Button
            onClick={() => window.location.href = '/my-itineraries'}
            size="sm"
            className="gap-1.5"
          >
            <FolderOpen className="h-4 w-4" />
            My Itineraries
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="bg-secondary border-border text-foreground hover:bg-accent border"
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
        <Card className="mt-4 bg-muted backdrop-blur-md border-border">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sort By */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground z-50">
                    <SelectItem value="start_date" className="focus:bg-accent focus:text-foreground">Trip Start Date</SelectItem>
                    <SelectItem value="end_date" className="focus:bg-accent focus:text-foreground">Trip End Date</SelectItem>
                    <SelectItem value="created_at" className="focus:bg-accent focus:text-foreground">Date Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border text-foreground hover:bg-accent",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={onDateFromChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background border-border text-foreground hover:bg-accent",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={onDateToChange}
                      initialFocus
                      className="p-3 pointer-events-auto"
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
