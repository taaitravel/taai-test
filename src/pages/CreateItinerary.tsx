
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plane, Send, Bot, User, ArrowLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface ItineraryData {
  name: string;
  startDate: string;
  endDate: string;
  people: number;
  budget: string;
  destinations: string;
  description: string;
  travelerTypes: string[];
}

const CreateItinerary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm your AI travel assistant. I'm here to help you create the perfect itinerary. Let's start with the basics - what would you like to name your trip?",
      timestamp: new Date()
    }
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [itineraryData, setItineraryData] = useState<ItineraryData>({
    name: '',
    startDate: '',
    endDate: '',
    people: 1,
    budget: '',
    destinations: '',
    description: '',
    travelerTypes: []
  });

  const chatFlow = [
    {
      field: 'name',
      question: "What would you like to name your trip?",
      followUp: "Great choice! When would you like to start your trip? (Please provide a date in YYYY-MM-DD format)"
    },
    {
      field: 'startDate',
      question: "When would you like to start your trip? (Please provide a date in YYYY-MM-DD format)",
      followUp: "Perfect! And when would you like to return? (Please provide a date in YYYY-MM-DD format)"
    },
    {
      field: 'endDate',
      question: "When would you like to return? (Please provide a date in YYYY-MM-DD format)",
      followUp: "Excellent! How many people will be traveling?"
    },
    {
      field: 'people',
      question: "How many people will be traveling?",
      followUp: "Got it! What's your estimated budget for this trip in USD?"
    },
    {
      field: 'budget',
      question: "What's your estimated budget for this trip in USD?",
      followUp: "Wonderful! Where would you like to go? (You can list multiple destinations separated by commas)"
    },
    {
      field: 'destinations',
      question: "Where would you like to go? (You can list multiple destinations separated by commas)",
      followUp: "Amazing destinations! Finally, could you tell me a bit about what kind of trip you're looking for? (Optional - you can also type 'skip')"
    },
    {
      field: 'description',
      question: "Could you tell me a bit about what kind of trip you're looking for? (Optional - you can also type 'skip')",
      followUp: "Perfect! I have all the information I need. Let me create your personalized itinerary!"
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'bot' | 'user', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;

    // Add user message
    addMessage('user', currentInput);

    // Process the input
    const currentField = chatFlow[currentStep]?.field;
    if (currentField) {
      const updatedData = { ...itineraryData };
      
      if (currentField === 'people') {
        updatedData[currentField] = parseInt(currentInput) || 1;
      } else if (currentField === 'description' && currentInput.toLowerCase() === 'skip') {
        updatedData[currentField] = '';
      } else {
        updatedData[currentField] = currentInput;
      }
      
      setItineraryData(updatedData);
    }

    // Add bot response
    setTimeout(() => {
      if (currentStep < chatFlow.length - 1) {
        addMessage('bot', chatFlow[currentStep].followUp);
        setCurrentStep(currentStep + 1);
      } else {
        addMessage('bot', "Perfect! I have all the information I need. Let me create your personalized itinerary!");
        setTimeout(() => {
          toast({
            title: "Itinerary Created!",
            description: "Your travel plan has been created successfully.",
          });
          navigate('/itinerary', { state: { itineraryData } });
        }, 2000);
      }
    }, 1000);

    setCurrentInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#171821] flex flex-col">
      {/* Navigation - Dashboard Header Style */}
      <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center">
              <img src="/lovable-uploads/1c94ff06-05c4-46fe-b015-481744bc6ce1.png" alt="TAAI Travel" className="h-8 w-[35.2px]" />
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-white/20 text-white border-white/30">
                Master Traveler
              </Badge>
              <Button 
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 p-2 rounded-full"
                onClick={() => navigate('/profile-setup')}
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">AI Travel Assistant</h1>
          <p className="text-white/70">Let me help you plan your perfect trip</p>
        </div>

        {/* Messages */}
        <Card className="flex-1 mb-4 bg-[#171821]/80 border-white/30 backdrop-blur-md">
          <CardContent className="p-4 h-96 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'bot' 
                        ? 'gold-gradient' 
                        : 'bg-white/20 border border-white/30'
                    }`}>
                      {message.type === 'bot' ? (
                        <Bot className="h-4 w-4 text-[#171821]" />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${
                      message.type === 'bot'
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'gold-gradient text-[#171821] font-medium'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <span className={`text-xs opacity-70 mt-1 block ${
                        message.type === 'bot' ? 'text-white/50' : 'text-[#171821]/70'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {/* Input */}
        <div className="flex space-x-2">
          <Input
            placeholder="Type your message..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!currentInput.trim()}
            className="gold-gradient hover:opacity-90 text-[#171821] font-semibold"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateItinerary;
