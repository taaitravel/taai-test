
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plane, Send, Bot, User, ArrowLeft } from "lucide-react";
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
      {/* Navigation */}
      <nav className="bg-[#171821]/95 backdrop-blur-md border-b border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="text-yellow-300 hover:text-yellow-200 hover:bg-yellow-400/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Plane className="h-8 w-8 text-yellow-400" />
              <span className="text-2xl font-bold luxury-text-gradient">
                TAAI Travel
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold luxury-text-gradient mb-2">AI Travel Assistant</h1>
          <p className="text-yellow-300/70">Let me help you plan your perfect trip</p>
        </div>

        {/* Messages */}
        <Card className="flex-1 mb-4 bg-[#171821]/60 border-yellow-500/30 backdrop-blur-md">
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
                        : 'bg-yellow-400/20 border border-yellow-400/30'
                    }`}>
                      {message.type === 'bot' ? (
                        <Bot className="h-4 w-4 text-[#171821]" />
                      ) : (
                        <User className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${
                      message.type === 'bot'
                        ? 'bg-[#2d2a1f] text-yellow-200 border border-yellow-500/20'
                        : 'gold-gradient text-[#171821] font-medium'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <span className={`text-xs opacity-70 mt-1 block ${
                        message.type === 'bot' ? 'text-yellow-300/50' : 'text-[#171821]/70'
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
            className="flex-1 bg-[#2d2a1f] border-yellow-500/30 text-yellow-200 placeholder:text-yellow-300/50 focus:border-yellow-400"
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
