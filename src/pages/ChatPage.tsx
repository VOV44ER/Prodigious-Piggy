import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { PlaceCard } from "@/components/place/PlaceCard";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendChatMessage, type ChatMessage as OpenAIMessage } from "@/integrations/openai/client";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  places?: Array<{
    name: string;
    address: string;
    category: string;
    cuisine: string;
    price: 1 | 2 | 3 | 4;
    rating: number;
    sentiment: number;
    imageUrl: string;
  }>;
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hey there! 🐷 I'm Piggy, your foodie discovery assistant. Ask me anything — like \"Find a cosy pub in East London\" or \"Japanese restaurants near Soho\" and I'll show you the best curated spots!",
    isUser: false,
    timestamp: new Date(),
  },
];

const suggestedQueries = [
  "Find a cosy pub in East London",
  "Best Japanese restaurants in Soho",
  "Romantic dinner spots in Covent Garden",
  "Hidden gem cafés in Shoreditch",
];

const SYSTEM_PROMPT = `You are Piggy, a friendly and knowledgeable foodie discovery assistant. You help users find the best restaurants, cafes, pubs, and dining spots in London and other cities. 

Your responses should be:
- Warm, friendly, and conversational (use emojis sparingly, especially 🐷)
- Helpful and informative about food and dining
- Focused on restaurant recommendations, cuisine types, locations, and dining experiences
- If users ask about non-food topics, politely redirect them back to food and dining

Keep responses concise but engaging.`;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const conversationHistory: OpenAIMessage[] = messages
        .filter((msg) => msg.id !== "1")
        .map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.content,
        }));

      conversationHistory.push({
        role: "user",
        content,
      });

      const response = await sendChatMessage(conversationHistory, SYSTEM_PROMPT);

      if (response.error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Sorry, I encountered an error: ${response.error}. Please try again later.`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: response.content,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (query: string) => {
    handleSend(query);
  };

  const clearChat = () => {
    setMessages(initialMessages);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 flex flex-col">
        {/* Header */ }
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-coral rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-charcoal-dark" />
              </div>
              <div>
                <h1 className="font-display font-semibold text-foreground">Chat with Piggy</h1>
                <p className="text-sm text-muted-foreground">AI-powered discovery</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <History className="h-4 w-4 mr-1" />
                History
              </Button>
              <Button variant="ghost" size="sm" onClick={ clearChat }>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */ }
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 max-w-3xl">
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                { messages.map((message) => (
                  <div key={ message.id }>
                    <ChatMessage
                      content={ message.content }
                      isUser={ message.isUser }
                      timestamp={ message.timestamp }
                    />
                    {/* Place Cards */ }
                    { message.places && message.places.length > 0 && (
                      <motion.div
                        initial={ { opacity: 0, y: 10 } }
                        animate={ { opacity: 1, y: 0 } }
                        className="mt-4 ml-12 grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        { message.places.map((place) => (
                          <PlaceCard key={ place.name } { ...place } />
                        )) }
                      </motion.div>
                    ) }
                  </div>
                )) }
              </AnimatePresence>

              {/* Typing Indicator */ }
              { isTyping && (
                <motion.div
                  initial={ { opacity: 0 } }
                  animate={ { opacity: 1 } }
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 bg-charcoal-dark rounded-full flex items-center justify-center">
                    <span className="text-cream text-xs">🐷</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={ { animationDelay: "0.1s" } } />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={ { animationDelay: "0.2s" } } />
                    </div>
                  </div>
                </motion.div>
              ) }

              {/* Suggestions (show only at start) */ }
              { messages.length === 1 && (
                <motion.div
                  initial={ { opacity: 0, y: 10 } }
                  animate={ { opacity: 1, y: 0 } }
                  transition={ { delay: 0.3 } }
                  className="pt-4"
                >
                  <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    { suggestedQueries.map((query) => (
                      <button
                        key={ query }
                        onClick={ () => handleSuggestionClick(query) }
                        className="px-4 py-2 bg-secondary hover:bg-accent text-secondary-foreground text-sm rounded-full transition-colors"
                      >
                        { query }
                      </button>
                    )) }
                  </div>
                </motion.div>
              ) }
            </div>
          </div>
        </div>

        {/* Input Area */ }
        <div className="border-t border-border bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 max-w-3xl">
            <ChatInput onSend={ handleSend } disabled={ isTyping } />
          </div>
        </div>
      </main>
    </div>
  );
}
