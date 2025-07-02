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

const AIReservationChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI travel assistant. I can help you with flight bookings, hotel reservations, and activity planning. What would you like to book today?",
      isBot: true,
      timestamp: new Date(),
      actions: [
        { type: 'quick-action', label: '✈️ Book Flights', data: { action: 'flights' } },
        { type: 'quick-action', label: '🏨 Reserve Hotels', data: { action: 'hotels' } },
        { type: 'quick-action', label: '🚗 Rent a Car', data: { action: 'car' } },
        { type: 'quick-action', label: '🎯 Plan Activities', data: { action: 'activities' } }
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
        // This would trigger a location picker in a real implementation
        addMessage(`Please specify the ${action.label.toLowerCase()}`);
        break;
      case 'guests':
        // Guest selector
        break;
      case 'budget':
        // Budget range selector
        break;
      default:
        break;
    }
  };

  const handleDateRangeSubmit = () => {
    if (selectedDateRange.from && selectedDateRange.to) {
      const dateText = `Travel dates: ${format(selectedDateRange.from, "MMM dd")} - ${format(selectedDateRange.to, "MMM dd, yyyy")}`;
      addMessage(dateText);
      
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          addMessage(
            `Great! I found several options for ${dateText}. Let me show you the best deals:`,
            true,
            [
              { type: 'quick-action', label: '✈️ View Flights ($450)', data: { price: 450 } },
              { type: 'quick-action', label: '🏨 See Hotels ($120/night)', data: { price: 120 } },
              { type: 'quick-action', label: '📋 Complete Package ($890)', data: { package: true } }
            ]
          );
        }, 1500);
      }, 100);
    }
  };

  const renderActionButtons = (actions: ChatAction[]) => {
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
                    className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
                  >
                    <CalendarIcon className="h-3 w-3 mr-2" />
                    {action.label}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
                        className="ml-2"
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
                    className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
                  >
                    <Users className="h-3 w-3 mr-2" />
                    {action.label}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="start">
                  <div className="p-3">
                    <div className="text-sm font-medium mb-2">Number of guests:</div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGuests(Math.max(1, selectedGuests - 1))}
                      >
                        -
                      </Button>
                      <span className="px-3 py-1 bg-secondary rounded text-sm">{selectedGuests}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGuests(selectedGuests + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3"
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
              className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="bg-card/95 border-primary/30 backdrop-blur-md h-96 flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-card-foreground flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <span>AI Reservation Assistant</span>
          <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary border-primary/30">
            Online
          </Badge>
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
                      ? "bg-secondary text-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {message.text}
                </div>
                
                {message.actions && renderActionButtons(message.actions)}
                
                <div className="text-xs text-muted-foreground mt-1 px-1">
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
                <div className="bg-secondary text-foreground rounded-lg px-3 py-2 text-sm">
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
        <div className="border-t border-border p-4">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about flights, hotels, or activities..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-secondary border-primary/30 text-foreground placeholder:text-muted-foreground focus:border-primary"
            />
            <Button
              onClick={handleSend}
              size="sm"
              disabled={!inputValue.trim()}
              className="px-3"
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