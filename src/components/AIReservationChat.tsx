import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Send, 
  Bot, 
  User, 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  Plane,
  Hotel,
  Car
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  actions?: ChatAction[];
}

interface ChatAction {
  type: 'date-range' | 'location' | 'guests' | 'budget' | 'quick-action';
  label: string;
  data?: any;
}

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface ItineraryData {
  name?: string;
  description?: string;
  dateStart?: string;
  dateEnd?: string;
  locations?: string[];
  mapLocations?: Array<{city: string, lat: number, lng: number}>;
  budget?: number;
  userType?: string;
  attendees?: Array<{id: number, name: string, email: string}>;
  flights?: Array<any>;
  hotels?: Array<any>;
  activities?: Array<any>;
  reservations?: Array<any>;
}

interface AIReservationChatProps {
  itineraryData?: ItineraryData;
  onUpdateData?: (updates: Partial<ItineraryData>) => void;
  onSaveItinerary?: () => Promise<void>;
  isSaving?: boolean;
  prefilledMessage?: string | null;
}

const AIReservationChat = ({ itineraryData, onUpdateData, onSaveItinerary, isSaving, prefilledMessage }: AIReservationChatProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI travel assistant. I can help you plan the perfect trip. Choose from our travel services, seasonal options, explore different terrains, luxury experiences, extreme sports, or find exciting events!",
      isBot: true,
      timestamp: new Date(),
      actions: [
        // Travel Services
        { type: 'quick-action', label: '✈️ Book Flights', data: { action: 'flights' } },
        { type: 'quick-action', label: '🏨 Reserve Hotels', data: { action: 'hotels' } },
        { type: 'quick-action', label: '📦 Travel Packages', data: { action: 'packages' } },
        { type: 'quick-action', label: '🚗 Rent a Car', data: { action: 'car' } },
        { type: 'quick-action', label: '🎯 Plan Activities', data: { action: 'activities' } },
        // Seasons & Deals - Reduced to 4 items
        { type: 'quick-action', label: '🌸 Spring Getaway', data: { action: 'spring' } },
        { type: 'quick-action', label: '☀️ Summer Vacation', data: { action: 'summer' } },
        { type: 'quick-action', label: '🍂 Fall Adventure', data: { action: 'fall' } },
        { type: 'quick-action', label: '❄️ Winter Escape', data: { action: 'winter' } },
        // Terrains & Destinations - Reduced to 4 items
        { type: 'quick-action', label: '🏝️ Tropical Paradise', data: { action: 'tropical' } },
        { type: 'quick-action', label: '🏔️ Mountain Retreat', data: { action: 'mountain' } },
        { type: 'quick-action', label: '🏖️ Beach Vacation', data: { action: 'beach' } },
        { type: 'quick-action', label: '🏙️ City Break', data: { action: 'city' } },
        // Luxury & Premium - Reduced to 4 items
        { type: 'quick-action', label: '💎 Luxury Resort', data: { action: 'luxury' } },
        { type: 'quick-action', label: '🛥️ Private Yacht', data: { action: 'yacht' } },
        { type: 'quick-action', label: '✈️ Private Jet', data: { action: 'private-jet' } },
        { type: 'quick-action', label: '💆 Spa Retreat', data: { action: 'spa' } },
        // Extreme Sports & Adventure - Reduced to 4 items
        { type: 'quick-action', label: '🪂 Skydiving', data: { action: 'skydiving' } },
        { type: 'quick-action', label: '🏂 Skiing/Snowboarding', data: { action: 'skiing' } },
        { type: 'quick-action', label: '🤿 Scuba Diving', data: { action: 'diving' } },
        { type: 'quick-action', label: '🧗 Rock Climbing', data: { action: 'climbing' } },
        // Events & Entertainment - Reduced to 4 items
        { type: 'quick-action', label: '🏎️ F1 Grand Prix', data: { action: 'f1' } },
        { type: 'quick-action', label: '🎵 Concerts & Music', data: { action: 'concerts' } },
        { type: 'quick-action', label: '⚽ Sports Events', data: { action: 'sports' } },
        { type: 'quick-action', label: '🎭 Theater & Shows', data: { action: 'theater' } }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [selectedLocation, setSelectedLocation] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle prefilled message on component mount
  useEffect(() => {
    if (prefilledMessage) {
      // Small delay to ensure component is fully rendered
      setTimeout(() => {
        setInputValue(prefilledMessage);
        setTimeout(() => {
          // Trigger send manually
          if (prefilledMessage.trim()) {
            addMessage(prefilledMessage);
            setInputValue("");
            
            // Simulate AI response
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              handleAIResponse(prefilledMessage);
            }, 1500);
          }
        }, 500);
      }, 1000);
    }
  }, [prefilledMessage]);

  const addMessage = (text: string, isBot: boolean = false, actions?: ChatAction[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot,
      timestamp: new Date(),
      actions
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    addMessage(inputValue);
    setInputValue("");
    
    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      handleAIResponse(inputValue);
    }, 1500);
  };

  const handleAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('flight') || lowerMessage.includes('fly')) {
      addMessage(
        "I'd be happy to help you find flights! Let me gather some details to find the best options for you.",
        true,
        [
          { type: 'location', label: '📍 Departure City' },
          { type: 'location', label: '📍 Destination' },
          { type: 'date-range', label: '📅 Travel Dates' },
          { type: 'guests', label: '👥 Passengers' }
        ]
      );
    } else if (lowerMessage.includes('hotel') || lowerMessage.includes('accommodation')) {
      addMessage(
        "Perfect! I'll help you find the ideal accommodation. Please provide your travel details:",
        true,
        [
          { type: 'location', label: '📍 Destination' },
          { type: 'date-range', label: '📅 Check-in & Check-out' },
          { type: 'guests', label: '👥 Guests' },
          { type: 'budget', label: '💰 Budget Range' }
        ]
      );
    } else if (lowerMessage.includes('car') || lowerMessage.includes('rental')) {
      addMessage(
        "I'll help you find a rental car! Let me know your requirements:",
        true,
        [
          { type: 'location', label: '📍 Pick-up Location' },
          { type: 'date-range', label: '📅 Rental Period' },
          { type: 'quick-action', label: '🚗 Economy', data: { carType: 'economy' } },
          { type: 'quick-action', label: '🚙 SUV', data: { carType: 'suv' } },
          { type: 'quick-action', label: '🏎️ Luxury', data: { carType: 'luxury' } }
        ]
      );
    } else {
      addMessage(
        "I understand you're looking for travel assistance. Here are some ways I can help:",
        true,
        [
          { type: 'quick-action', label: '✈️ Flight Search', data: { action: 'flights' } },
          { type: 'quick-action', label: '🏨 Hotel Booking', data: { action: 'hotels' } },
          { type: 'quick-action', label: '📦 Package (Flight + Hotel)', data: { action: 'package' } },
          { type: 'quick-action', label: '🚗 Car Rental', data: { action: 'car' } },
          { type: 'quick-action', label: '🎯 Activity Planning', data: { action: 'activities' } }
        ]
      );
    }
  };

  const handleActionClick = (action: ChatAction) => {
    switch (action.type) {
      case 'quick-action':
        addMessage(`I'd like to ${action.label.toLowerCase()}`);
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            handleAIResponse(action.label);
          }, 1500);
        }, 100);
        break;
      case 'location':
        // Enhanced location input - in real implementation would use maps/autocomplete
        const locationInput = prompt(`Enter ${action.label.includes('Departure') ? 'departure city' : action.label.includes('Destination') ? 'destination' : 'location'}:`);
        if (locationInput && onUpdateData) {
          if (action.label.includes('Departure')) {
            addMessage(`Departure: ${locationInput}`);
          } else if (action.label.includes('Destination')) {
            const currentLocations = itineraryData?.locations || [];
            onUpdateData({
              locations: [...currentLocations, locationInput],
              mapLocations: [...(itineraryData?.mapLocations || []), { city: locationInput, lat: 0, lng: 0 }]
            });
            addMessage(`Destination: ${locationInput}`);
            
            // Trigger search for travel options
            if (itineraryData?.dateStart && itineraryData?.dateEnd) {
              searchTravelOptions(locationInput);
            }
          }
        }
        break;
      case 'guests':
        // Guest selector handled in popover
        break;
      case 'budget':
        const budgetInput = prompt('Enter your budget in USD:');
        if (budgetInput && onUpdateData) {
          const budget = parseFloat(budgetInput);
          onUpdateData({ budget });
          addMessage(`Budget set: $${budget.toLocaleString()}`);
        }
        break;
      default:
        break;
    }
  };

  const searchTravelOptions = async (destination: string) => {
    if (!itineraryData?.dateStart || !itineraryData?.dateEnd) return;
    
    setIsTyping(true);
    try {
      // Search for flights first
      const flightResponse = await fetch('https://dhbvweazpqnviqwgpurv.supabase.co/functions/v1/search-travel-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'flights',
          origin: 'New York', // Default or get from user
          destination,
          checkIn: itineraryData.dateStart,
          checkOut: itineraryData.dateEnd,
          guests: selectedGuests
        })
      });
      
      const flightData = await flightResponse.json();
      
      // Search for hotels
      const hotelResponse = await fetch('https://dhbvweazpqnviqwgpurv.supabase.co/functions/v1/search-travel-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'hotels',
          destination,
          checkIn: itineraryData.dateStart,
          checkOut: itineraryData.dateEnd,
          guests: selectedGuests,
          budget: itineraryData.budget
        })
      });
      
      const hotelData = await hotelResponse.json();
      
      setIsTyping(false);
      
      // Update itinerary data with found options
      if (onUpdateData) {
        onUpdateData({
          flights: flightData.flights,
          hotels: hotelData.hotels
        });
      }
      
      addMessage(
        `Great! I found ${flightData.flights?.length || 0} flight options and ${hotelData.hotels?.length || 0} hotel options for ${destination}. Here are the best recommendations:`,
        true,
        [
          { type: 'quick-action', label: `✈️ ${flightData.flights?.[0]?.airline} - $${flightData.flights?.[0]?.price}`, data: { type: 'select-flight', flight: flightData.flights?.[0] } },
          { type: 'quick-action', label: `🏨 ${hotelData.hotels?.[0]?.name} - $${hotelData.hotels?.[0]?.price_per_night}/night`, data: { type: 'select-hotel', hotel: hotelData.hotels?.[0] } },
          { type: 'quick-action', label: '💾 Ready to Save Itinerary', data: { type: 'save-ready' } },
          { type: 'quick-action', label: '🎯 Add More Activities', data: { action: 'activities' } }
        ]
      );
    } catch (error) {
      setIsTyping(false);
      console.error('Error searching travel options:', error);
      addMessage("I encountered an error searching for options. Let me help you manually input your preferences.", true);
    }
  };

  const handleDateRangeSubmit = () => {
    if (selectedDateRange.from && selectedDateRange.to && onUpdateData) {
      const dateStart = selectedDateRange.from.toISOString().split('T')[0];
      const dateEnd = selectedDateRange.to.toISOString().split('T')[0];
      
      onUpdateData({
        dateStart,
        dateEnd
      });
      
      const dateText = `Travel dates: ${format(selectedDateRange.from, "MMM dd")} - ${format(selectedDateRange.to, "MMM dd, yyyy")}`;
      addMessage(dateText);
      
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage(
            `Perfect! I've saved your travel dates (${dateText}). Now let me help you find flights and hotels. What's your departure city?`,
            true,
            [
              { type: 'location', label: '📍 Add Departure City' },
              { type: 'location', label: '📍 Add Destination' },
              { type: 'budget', label: '💰 Set Budget' }
            ]
          );
        }, 1500);
      }, 100);
    }
  };

  const renderActionButtons = (actions: ChatAction[]) => {
    // Check if this is the initial message with organized categories
    if (actions.length > 10) {
      const travelServices = actions.slice(0, 5); // Now includes packages
      const seasonsDeals = actions.slice(5, 9);
      const terrains = actions.slice(9, 13);
      const luxury = actions.slice(13, 17);
      const extremeSports = actions.slice(17, 21);
      const events = actions.slice(21);

      return (
        <div className="mt-4 space-y-4">
          {/* Travel Services */}
          <div className="space-y-2">
            <div className="text-xs font-semibold luxury-text-gradient uppercase tracking-wider">Travel Services</div>
            <div className="flex flex-wrap gap-2">
              {travelServices.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="gold-gradient text-white hover:text-gray-300 hover:opacity-80 border-0 shadow-lg transition-all duration-300"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Seasons & Deals */}
          <div className="space-y-2">
            <div className="text-xs font-semibold luxury-text-gradient uppercase tracking-wider">Seasons & Deals</div>
            <div className="flex flex-wrap gap-2">
              {seasonsDeals.map((action, index) => (
                <Button
                  key={index + 4}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="gold-gradient text-white hover:text-gray-300 hover:opacity-80 border-0 shadow-lg transition-all duration-300"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Terrains & Destinations */}
          <div className="space-y-2">
            <div className="text-xs font-semibold luxury-text-gradient uppercase tracking-wider">Terrains & Destinations</div>
            <div className="flex flex-wrap gap-2">
              {terrains.map((action, index) => (
                <Button
                  key={index + 10}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="gold-gradient text-white hover:text-gray-300 hover:opacity-80 border-0 shadow-lg transition-all duration-300"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Luxury & Premium */}
          <div className="space-y-2">
            <div className="text-xs font-semibold luxury-text-gradient uppercase tracking-wider">Luxury & Premium</div>
            <div className="flex flex-wrap gap-2">
              {luxury.map((action, index) => (
                <Button
                  key={index + 16}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="gold-gradient text-white hover:text-gray-300 hover:opacity-80 border-0 shadow-lg transition-all duration-300"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Extreme Sports & Adventure */}
          <div className="space-y-2">
            <div className="text-xs font-semibold luxury-text-gradient uppercase tracking-wider">Extreme Sports & Adventure</div>
            <div className="flex flex-wrap gap-2">
              {extremeSports.map((action, index) => (
                <Button
                  key={index + 22}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="gold-gradient text-white hover:text-gray-300 hover:opacity-80 border-0 shadow-lg transition-all duration-300"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Events & Entertainment */}
          <div className="space-y-2">
            <div className="text-xs font-semibold luxury-text-gradient uppercase tracking-wider">Events & Entertainment</div>
            <div className="flex flex-wrap gap-2">
              {events.map((action, index) => (
                <Button
                  key={index + 28}
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  className="gold-gradient text-white hover:text-gray-300 hover:opacity-80 border-0 shadow-lg transition-all duration-300"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Default rendering for other messages
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {actions.map((action, index) => {
          if (action.type === 'date-range') {
            return (
              <Popover key={index}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gold-gradient text-white hover:text-gray-300 hover:opacity-80 border-0"
                  >
                    <CalendarIcon className="h-3 w-3 mr-2" />
                    {action.label}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-primary/30" align="start">
                  <div className="p-3">
                    <div className="text-sm font-medium mb-2">Select travel dates:</div>
                    <Calendar
                      mode="range"
                      selected={selectedDateRange}
                      onSelect={setSelectedDateRange}
                      numberOfMonths={2}
                      className={cn("pointer-events-auto")}
                    />
                    <div className="flex justify-between mt-3">
                      <div className="text-xs text-muted-foreground">
                        {selectedDateRange.from && selectedDateRange.to
                          ? `${format(selectedDateRange.from, "MMM dd")} - ${format(selectedDateRange.to, "MMM dd")}`
                          : "Select date range"}
                      </div>
                      <Button
                        size="sm"
                        onClick={handleDateRangeSubmit}
                        disabled={!selectedDateRange.from || !selectedDateRange.to}
                        className="ml-2 gold-gradient text-background"
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          if (action.type === 'guests') {
            return (
              <Popover key={index}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gold-gradient text-white hover:text-gray-300 hover:opacity-80 border-0"
                  >
                    <Users className="h-3 w-3 mr-2" />
                    {action.label}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-background border-primary/30" align="start">
                  <div className="p-3">
                    <div className="text-sm font-medium mb-2">Number of guests:</div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGuests(Math.max(1, selectedGuests - 1))}
                        className="border-primary/30"
                      >
                        -
                      </Button>
                      <span className="px-3 py-1 bg-secondary rounded text-sm">{selectedGuests}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGuests(selectedGuests + 1)}
                        className="border-primary/30"
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3 gold-gradient text-background"
                      onClick={() => {
                        addMessage(`${selectedGuests} ${selectedGuests === 1 ? 'guest' : 'guests'}`);
                      }}
                    >
                      Confirm
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleActionClick(action)}
              className="gold-gradient text-white hover:text-gray-300 hover:opacity-80 border-0 shadow-lg transition-all duration-300"
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-[#171821]/95 backdrop-blur-md border-white/30 min-h-[500px] flex flex-col shadow-2xl shadow-white/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center justify-between">
          <span className="luxury-text-gradient font-bold">Plan Your Perfect Trip</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-[#1f1f27] border-white/30 text-white hover:bg-white/10"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {selectedDateRange.from && selectedDateRange.to
                  ? `${format(selectedDateRange.from, "MMM dd")} - ${format(selectedDateRange.to, "MMM dd")}`
                  : "Select travel dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#171821] border-white/30" align="start">
              <div className="p-3">
                <div className="text-sm font-medium mb-2 text-white">Select travel dates:</div>
                <Calendar
                  mode="range"
                  selected={selectedDateRange}
                  onSelect={setSelectedDateRange}
                  numberOfMonths={2}
                  className={cn("pointer-events-auto")}
                />
                <div className="flex justify-between mt-3">
                  <div className="text-xs text-white/70">
                    {selectedDateRange.from && selectedDateRange.to
                      ? `${format(selectedDateRange.from, "MMM dd")} - ${format(selectedDateRange.to, "MMM dd")}`
                      : "Select date range"}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleDateRangeSubmit}
                    disabled={!selectedDateRange.from || !selectedDateRange.to}
                    className="ml-2 gold-gradient text-background"
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[80%] ${message.isBot ? 'order-2' : 'order-1'}`}>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    message.isBot
                      ? "bg-[#1f1f27] text-white border border-white/20"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {message.text}
                </div>
                
                {message.actions && renderActionButtons(message.actions)}
                
                <div className="text-xs text-white/50 mt-1 px-1">
                  {format(message.timestamp, "HH:mm")}
                </div>
              </div>
              
              <div className={`${message.isBot ? 'order-1 mr-2' : 'order-2 ml-2'} flex-shrink-0`}>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center",
                  message.isBot ? "bg-primary/20" : "bg-secondary"
                )}>
                  {message.isBot ? (
                    <Bot className="h-3 w-3 text-primary" />
                  ) : (
                    <User className="h-3 w-3 text-foreground" />
                  )}
                </div>
              </div>
            </div>
          ))}
          
              {isTyping && (
            <div className="flex justify-start">
              <div className="order-2 max-w-[80%]">
                <div className="bg-[#1f1f27] text-white border border-white/20 rounded-lg px-3 py-2 text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
              <div className="order-1 mr-2 flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/30 p-4">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about flights, hotels, or activities..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-[#1f1f27] border-white/30 text-white placeholder:text-white/50 focus:border-white"
            />
            <Button
              onClick={handleSend}
              size="sm"
              disabled={!inputValue.trim()}
              className="px-3 gold-gradient text-background"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIReservationChat;