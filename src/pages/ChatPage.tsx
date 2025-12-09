import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { PlaceCard } from "@/components/place/PlaceCard";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { sendChatMessage, type ChatMessage as OpenAIMessage } from "@/integrations/openai/client";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const initialMessages: Message[] = [
  {
    id: "1",
    content: "Hey there! 🐷 I'm Piggy, your foodie discovery assistant for Casablanca, Morocco. Ask me anything — like \"Best Moroccan restaurants in Casablanca\" or \"Where to find great coffee shops\" and I'll help you discover the best curated spots in the city!",
    isUser: false,
    timestamp: new Date(),
  },
];

const suggestedQueries = [
  "Best Moroccan restaurants in Casablanca",
  "Where to find great coffee shops",
  "Romantic dinner spots with a view",
  "Traditional Moroccan bakeries",
];

const SYSTEM_PROMPT = `You are Piggy, a friendly and knowledgeable foodie discovery assistant specializing in Casablanca, Morocco. You help users find the best restaurants, cafes, bakeries, and dining spots in Casablanca.

Available places in Casablanca include:
- % Arabica (Cafe, Coffee) - N°144 angle boulevard d'anfa et, Rue La Fontaine
- La Sqala (Restaurant, Moroccan) - Bd des Almohades
- Le Cabestan (Restaurant, Mediterranean) - Phare d'El hank
- Le Gatsby (Restaurant, International) - Bd Sour Jdid
- Maison Amande & Miel (Bakery, French) - Rue d'Ifrane
- NKOA (Restaurant, African) - Abou Kacem Chabi Quartier
- Pâtisserie Bennis Habous (Bakery, Moroccan) - Rue Fkih El Gabbas
- Rick's Café (Restaurant, International) - Bd Sour Jdid
- Saveurs Du Palais (Restaurant, Moroccan) - Rue Jalal Eddine Sayouti

Your responses should be:
- Warm, friendly, and conversational (use emojis sparingly, especially 🐷)
- Helpful and informative about food and dining in Casablanca
- Focused on restaurant recommendations, cuisine types, locations, and dining experiences in Casablanca
- Mention specific places when relevant to the user's query
- If users ask about non-food topics or other cities, politely redirect them back to food and dining in Casablanca

Keep responses concise but engaging.`;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );

  useEffect(() => {
    if (!user) return;

    const loadSessions = async () => {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("id, title, created_at, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        toast({
          title: "Failed to load history",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSessions(data || []);
    };

    loadSessions();
  }, [toast, user]);

  const loadMessages = async (sessionId: string) => {
    setIsLoadingMessages(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, metadata, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Failed to load chat",
        description: error.message,
        variant: "destructive",
      });
      setIsLoadingMessages(false);
      return;
    }

    const mapped: Message[] = (data || []).map((message) => ({
      id: message.id,
      content: message.content,
      isUser: message.role === "user",
      timestamp: message.created_at ? new Date(message.created_at) : new Date(),
      places: message.metadata && typeof message.metadata === "object" ? (message.metadata as Message["places"]) : undefined,
    }));

    setMessages(mapped);
    setIsLoadingMessages(false);
  };

  const createSessionIfNeeded = async (firstMessage: string) => {
    if (selectedSessionId) return selectedSessionId;
    if (!user) return null;

    const title = firstMessage.slice(0, 80);
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title })
      .select("id, title, created_at, updated_at")
      .single();

    if (error) {
      toast({
        title: "Failed to create chat",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    if (data) {
      setSessions((prev) => [data, ...prev]);
      setSelectedSessionId(data.id);
    }

    return data?.id || null;
  };

  const updateSessionMeta = async (sessionId: string, fallbackTitle?: string) => {
    const now = new Date().toISOString();
    const currentSession = sessions.find((item) => item.id === sessionId);
    const nextTitle = currentSession?.title || fallbackTitle;

    const { data, error } = await supabase
      .from("chat_sessions")
      .update({ updated_at: now, title: nextTitle })
      .eq("id", sessionId)
      .select("id, title, created_at, updated_at")
      .single();

    if (!error && data) {
      setSessions((prev) => {
        const filtered = prev.filter((session) => session.id !== sessionId);
        return [data, ...filtered];
      });
    }
  };

  const handleSend = async (content: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save chat history.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const sessionId = await createSessionIfNeeded(content);
      if (!sessionId) {
        setIsTyping(false);
        return;
      }

      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "user",
        content,
      });

      const conversationHistory: OpenAIMessage[] = messages.map((msg) => ({
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

        await supabase.from("chat_messages").insert({
          session_id: sessionId,
          role: "assistant",
          content: aiResponse.content,
        });

        await updateSessionMeta(sessionId, content.slice(0, 80));
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

  const handleSelectSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    await loadMessages(sessionId);
  };

  const startNewChat = () => {
    setSelectedSessionId(null);
    setMessages(initialMessages);
  };

  const confirmDeleteSession = (session: ChatSession) => {
    setSessionToDelete(session);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionToDelete.id);

    if (error) {
      toast({
        title: "Failed to delete chat",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));

    if (selectedSessionId === sessionToDelete.id) {
      setSelectedSessionId(null);
      setMessages(initialMessages);
    }

    toast({ title: "Chat deleted" });
    setSessionToDelete(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 flex">
        {/* Sidebar - Chat History */ }
        <div className="w-64 border-r border-border bg-card/30 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Chat History</h2>
              <span className="text-xs text-muted-foreground">
                { sessions.length > 0 ? `${sessions.length} chats` : "No chats yet" }
              </span>
            </div>
            <Button size="sm" className="mt-3 w-full justify-center" onClick={ startNewChat }>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            { sessions.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Start a new conversation
              </div>
            ) : (
              <div className="space-y-1">
                { sessions.map((session) => (
                  <button
                    key={ session.id }
                    onClick={ () => handleSelectSession(session.id) }
                    className={ cn(
                      "group w-full text-left px-3 py-2 rounded-lg transition relative overflow-hidden",
                      "hover:bg-accent",
                      selectedSessionId === session.id ? "bg-primary/10 border border-primary" : "",
                    ) }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          { session.title || "New Chat" }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          { session.updated_at
                            ? new Date(session.updated_at).toLocaleDateString([], { month: "short", day: "numeric" })
                            : "" }
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100"
                        onClick={ (e) => {
                          e.stopPropagation();
                          confirmDeleteSession(session);
                        } }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </button>
                )) }
              </div>
            ) }
          </div>
        </div>

        {/* Main Chat Area */ }
        <div className="flex-1 flex flex-col">
          {/* Header */ }
          <div className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-coral rounded-xl flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-charcoal-dark" />
                </div>
                <div>
                  <h1 className="font-display font-semibold text-foreground">Chat with Piggy</h1>
                  <p className="text-sm text-muted-foreground">
                    { selectedSession ? selectedSession.title || "New Chat" : "New Chat" }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */ }
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-6 py-6 max-w-3xl">
              <div className="space-y-6">
                { isLoadingMessages && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading messages...
                  </div>
                ) }
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
                { messages.length <= 1 && !selectedSessionId && (
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
            <div className="container mx-auto px-6 py-4 max-w-3xl">
              <ChatInput onSend={ handleSend } disabled={ isTyping } />
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={ !!sessionToDelete } onOpenChange={ (open) => !open && setSessionToDelete(null) }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the chat and all messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={ handleDeleteSession } className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
