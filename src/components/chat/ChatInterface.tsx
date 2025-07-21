import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, Loader2, Hotel } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SwipeHotelSelector } from '@/components/swipe/SwipeHotelSelector';
import { SwipeFlightSelector } from '@/components/swipe/SwipeFlightSelector';
import { SwipeActivitySelector } from '@/components/swipe/SwipeActivitySelector';
import { SwipeRestaurantSelector } from '@/components/swipe/SwipeRestaurantSelector';
import { HotelSwipeItem, FlightSwipeItem, ActivitySwipeItem, RestaurantSwipeItem } from '@/components/swipe/types';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  searchResults?: any[];
  resultType?: string;
  functionUsed?: string;
}

interface ChatInterfaceProps {
  context?: string;
  placeholder?: string;
  embedded?: boolean; // New prop for embedded vs floating mode
  itineraryId?: string; // For saving swipe results
  onLocationAdded?: () => void; // Callback when new locations are added
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  context, 
  placeholder = "Ask TAAI about flights, hotels, budgets, or trip planning...",
  embedded = false,
  itineraryId,
  onLocationAdded
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [swipeHotels, setSwipeHotels] = useState<HotelSwipeItem[]>([]);
  const [swipeFlights, setSwipeFlights] = useState<FlightSwipeItem[]>([]);
  const [swipeActivities, setSwipeActivities] = useState<ActivitySwipeItem[]>([]);
  const [swipeRestaurants, setSwipeRestaurants] = useState<RestaurantSwipeItem[]>([]);
  const [showSwipeInterface, setShowSwipeInterface] = useState(false);
  const [swipeType, setSwipeType] = useState<'hotel' | 'flight' | 'activity' | 'restaurant' | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-gpt', {
        body: {
          message: userMessage.content,
          context: context
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        searchResults: data.searchResults,
        resultType: data.resultType,
        functionUsed: data.functionUsed,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Extract different types of results from the response
      if (data.hotels && Array.isArray(data.hotels)) {
        setSwipeHotels(data.hotels);
      }
      if (data.flights && Array.isArray(data.flights)) {
        setSwipeFlights(data.flights);
      }
      if (data.activities && Array.isArray(data.activities)) {
        setSwipeActivities(data.activities);
      }
      if (data.restaurants && Array.isArray(data.restaurants)) {
        setSwipeRestaurants(data.restaurants);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStartSwiping = (type: 'hotel' | 'flight' | 'activity' | 'restaurant') => {
    setSwipeType(type);
    setShowSwipeInterface(true);
  };

  const handleBackToChat = () => {
    setShowSwipeInterface(false);
    setSwipeType(null);
  };

  // For embedded mode, render directly without floating behavior
  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-transparent">
        {/* Swipe Interface */}
        {showSwipeInterface && swipeType && itineraryId ? (
          <div className="flex-1 p-4">
            {swipeType === 'hotel' && (
              <SwipeHotelSelector
                hotels={swipeHotels}
                itineraryId={itineraryId}
                onBack={handleBackToChat}
                onLocationAdded={onLocationAdded}
                onSwipeComplete={(liked, rejected) => {
                  console.log('Hotel swipe complete:', { liked, rejected });
                }}
              />
            )}
            {swipeType === 'flight' && (
              <SwipeFlightSelector
                flights={swipeFlights}
                itineraryId={itineraryId}
                onBack={handleBackToChat}
                onLocationAdded={onLocationAdded}
                onSwipeComplete={(liked, rejected) => {
                  console.log('Flight swipe complete:', { liked, rejected });
                }}
              />
            )}
            {swipeType === 'activity' && (
              <SwipeActivitySelector
                activities={swipeActivities}
                itineraryId={itineraryId}
                onBack={handleBackToChat}
                onLocationAdded={onLocationAdded}
                onSwipeComplete={(liked, rejected) => {
                  console.log('Activity swipe complete:', { liked, rejected });
                }}
              />
            )}
            {swipeType === 'restaurant' && (
              <SwipeRestaurantSelector
                restaurants={swipeRestaurants}
                itineraryId={itineraryId}
                onBack={handleBackToChat}
                onLocationAdded={onLocationAdded}
                onSwipeComplete={(liked, rejected) => {
                  console.log('Restaurant swipe complete:', { liked, rejected });
                }}
              />
            )}
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-white/60 py-8">
                    <Bot className="h-8 w-8 mx-auto mb-3 text-orange-400" />
                    <p className="text-sm text-white/80">Hi! I'm TAAI, your elite travel planning assistant. I can help you plan trips, optimize budgets, find flights & hotels, and create amazing itineraries. What adventure can I help you plan?</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                            : 'bg-white/10 text-white border border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-orange-400" />}
                          {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Show swipe buttons if results are available */}
                {(swipeHotels.length > 0 || swipeFlights.length > 0 || swipeActivities.length > 0 || swipeRestaurants.length > 0) && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {swipeHotels.length > 0 && (
                      <Button
                        onClick={() => handleStartSwiping('hotel')}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-4 py-2 text-sm"
                      >
                        🏨 Swipe Hotels ({swipeHotels.length})
                      </Button>
                    )}
                    {swipeFlights.length > 0 && (
                      <Button
                        onClick={() => handleStartSwiping('flight')}
                        className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium px-4 py-2 text-sm"
                      >
                        ✈️ Swipe Flights ({swipeFlights.length})
                      </Button>
                    )}
                    {swipeActivities.length > 0 && (
                      <Button
                        onClick={() => handleStartSwiping('activity')}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium px-4 py-2 text-sm"
                      >
                        🎯 Swipe Activities ({swipeActivities.length})
                      </Button>
                    )}
                    {swipeRestaurants.length > 0 && (
                      <Button
                        onClick={() => handleStartSwiping('restaurant')}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium px-4 py-2 text-sm"
                      >
                        🍽️ Swipe Restaurants ({swipeRestaurants.length})
                      </Button>
                    )}
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-orange-400" />
                        <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
                        <span className="text-sm text-white/80">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/20">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={placeholder}
                  disabled={isLoading}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-orange-400"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Floating mode behavior (original)
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl bg-background border">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-semibold">TAAI Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0"
        >
          ×
        </Button>
      </div>

      <CardContent className="p-0 h-full flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Hi! I'm TAAI, your elite travel planning assistant. I can help you plan trips, optimize budgets, find flights & hotels, and create amazing itineraries. What adventure can I help you plan?</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.role === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};