import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatPlaceItem } from "@/components/chat/ChatPlaceItem";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Plus, Trash2, PanelLeftClose, PanelLeftOpen, MapPin, Navigation } from "lucide-react";
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
import { usePlaces } from "@/hooks/usePlaces";
import { getUserReactionsForPlaces } from "@/hooks/useReactions";
import { getMapboxToken } from "@/integrations/mapbox/client";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  places?: Array<{
    id: string;
    name: string;
    address: string;
    category: string;
    cuisine?: string;
    price: 1 | 2 | 3 | 4;
    sentiment: number;
    favouritesCount: number;
    likesCount: number;
    dislikeCount: number;
    piggyPoints?: 1 | 2 | 3;
  }>;
}

interface ChatSession {
  id: string;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const createInitialMessage = (cityName: string) => ({
  id: "1",
  content: `Hey there! 🐷 I'm The Piggy, your foodie discovery assistant for ${cityName}. Ask me anything — like "Best restaurants in ${cityName.split(',')[0]}" or "Where to find great coffee shops" and I'll help you discover the best curated spots in the city!`,
  isUser: false,
  timestamp: new Date(),
});

const createSuggestedQueries = (cityName: string) => {
  const city = cityName.split(',')[0];
  return [
    `Best restaurants in ${city}`,
    "Where to find great coffee shops",
    "Romantic dinner spots with a view",
    "Traditional bakeries",
  ];
};

const createSystemPrompt = (cityName: string, places: Array<{ name: string; address: string; category: string; cuisine: string | null; price: number; sentiment: number; id: string }>) => {
  const city = cityName.split(',')[0];
  const placesList = places.length > 0
    ? places.slice(0, 20).map(place => {
      const cuisineStr = place.cuisine ? `, ${place.cuisine}` : '';
      const priceSymbols = "$".repeat(place.price);
      return `- ${place.name} (${place.category}${cuisineStr}) ${priceSymbols} - ${place.address}`;
    }).join('\n')
    : 'No places available yet.';

  return `You are The Piggy, a friendly and knowledgeable foodie discovery assistant specializing in ${cityName}. You help users find the best restaurants, cafes, bakeries, and dining spots in ${city}.

Available places in ${city} include:
${placesList}

When recommending places, format each place recommendation EXACTLY like this:

**PLACE_NAME** $$ ❤️➕👍👎
Full address with city and postal code, Country
🐖 | 👍SENTIMENT% | ❤️FAVOURITES_COUNTx

Where:
- PLACE_NAME is the exact name from the list above
- $$ represents price level (use $, $$, $$$, or $$$$)
- ❤️➕👍👎 are reaction emojis (always include all four, they will be clickable buttons)
- Full address should include street, city, postal code, and country
- SENTIMENT% is the sentiment score percentage
- FAVOURITES_COUNTx is the number of favourites

Your responses should be:
- Warm, friendly, and conversational (use emojis sparingly, especially 🐷)
- When recommending places, use the exact format above for each place
- You can add brief context before or after the formatted place, but keep it concise
- If users ask about non-food topics or other cities, politely redirect them back to food and dining in ${city}

Keep responses concise but engaging.`;
};

export default function ChatPage() {
  const [homeCity, setHomeCity] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [useLiveLocation, setUseLiveLocation] = useState(() => {
    const saved = localStorage.getItem('chat_use_live_location');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [liveCity, setLiveCity] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { user } = useAuth();

  const activeCity = useLiveLocation ? liveCity : homeCity;
  const { places: allPlaces, refetch: refetchPlaces } = usePlaces(activeCity);

  const cityName = activeCity || "your city";
  const initialMessages = useMemo(() => [createInitialMessage(cityName)], [cityName]);
  const suggestedQueries = useMemo(() => createSuggestedQueries(cityName), [cityName]);
  const systemPrompt = useMemo(() => createSystemPrompt(
    cityName,
    allPlaces.map(p => ({
      name: p.name,
      address: p.address,
      category: p.category,
      cuisine: p.cuisine || null,
      price: p.price,
      sentiment: p.sentiment,
      id: p.id,
    }))
  ), [cityName, allPlaces]);

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('chat_sidebar_open');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [userReactions, setUserReactions] = useState<Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>>({});
  const [userReactionsById, setUserReactionsById] = useState<Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>>({});
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const parsePlacesFromResponse = useCallback((content: string): Array<{ id: string; name: string; address: string; category: string; cuisine?: string; price: 1 | 2 | 3 | 4; sentiment: number; favouritesCount: number; likesCount: number; dislikeCount: number; piggyPoints?: 1 | 2 | 3 }> => {
    const places: Array<{ id: string; name: string; address: string; category: string; cuisine?: string; price: 1 | 2 | 3 | 4; sentiment: number; favouritesCount: number; likesCount: number; dislikeCount: number; piggyPoints?: 1 | 2 | 3 }> = [];

    const placePattern = /\*\*([^*]+)\*\*\s*(\$+)\s*❤️➕👍👎\s*\n([^\n]+)\s*\n🐖\s*\|\s*👍(\d+)%\s*\|\s*❤️(\d+)x/gi;
    let match;

    while ((match = placePattern.exec(content)) !== null) {
      const placeName = match[1].trim();
      const priceSymbols = match[2];

      const price = Math.min(Math.max(priceSymbols.length, 1), 4) as 1 | 2 | 3 | 4;

      const foundPlace = allPlaces.find(p => p.name === placeName);
      if (foundPlace) {
        const likesCount = foundPlace.likesCount || 0;
        const dislikeCount = foundPlace.dislikeCount || 0;
        const totalLikeDislike = likesCount + dislikeCount;
        const likesPercentage = totalLikeDislike > 0 ? Math.round((likesCount / totalLikeDislike) * 100) : 0;

        places.push({
          id: foundPlace.id,
          name: foundPlace.name,
          address: foundPlace.address,
          category: foundPlace.category,
          cuisine: foundPlace.cuisine || undefined,
          price,
          sentiment: likesPercentage,
          favouritesCount: foundPlace.favouritesCount || 0,
          likesCount,
          dislikeCount,
          piggyPoints: foundPlace.piggyPoints,
        });
      }
    }

    return places;
  }, [allPlaces]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );

  const loadUserProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();

        if (!error && data?.location) {
          setHomeCity(data.location);
        } else {
          setHomeCity(null);
        }
      } else {
        const storedProfile = localStorage.getItem('user_profile');
        if (storedProfile) {
          try {
            const profile = JSON.parse(storedProfile);
            if (profile.location) {
              setHomeCity(profile.location);
            } else {
              setHomeCity(null);
            }
          } catch {
            setHomeCity(null);
          }
        } else {
          setHomeCity(null);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setHomeCity(null);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user]);

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoadingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      const token = getMapboxToken();

      if (!token) {
        toast({
          title: "Mapbox token not found",
          description: "Cannot determine city without Mapbox token.",
          variant: "destructive",
        });
        setIsLoadingLocation(false);
        return null;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=place&limit=1`
      );

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const cityName = feature.text || feature.place_name?.split(',')[0];
        const context = feature.context || [];
        const country = context.find((c: any) => c.id?.startsWith('country'))?.text;
        const city = country ? `${cityName}, ${country}` : cityName;
        setLiveCity(city);
        setIsLoadingLocation(false);
        return city;
      } else {
        toast({
          title: "Location not found",
          description: "Could not determine city from your location.",
          variant: "destructive",
        });
        setIsLoadingLocation(false);
        return null;
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast({
        title: "Location error",
        description: error instanceof Error ? error.message : "Failed to get your location.",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
      return null;
    }
  }, [toast]);

  useEffect(() => {
    if (useLiveLocation && !liveCity) {
      getCurrentLocation();
    }
  }, [useLiveLocation, liveCity, getCurrentLocation]);

  const handleToggleLiveLocation = async () => {
    const newValue = !useLiveLocation;
    setUseLiveLocation(newValue);
    localStorage.setItem('chat_use_live_location', JSON.stringify(newValue));

    if (newValue && !liveCity) {
      await getCurrentLocation();
    }
  };

  useEffect(() => {
    loadUserProfile();

    const handleProfileUpdate = () => {
      loadUserProfile();
    };

    window.addEventListener('profile_updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profile_updated', handleProfileUpdate);
    };
  }, [loadUserProfile]);

  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([createInitialMessage(cityName)]);
    }
  }, [cityName, selectedSessionId]);

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

    const mapped: Message[] = (data || []).map((message) => {
      const isUser = message.role === "user";
      const parsedPlaces = !isUser ? parsePlacesFromResponse(message.content) : undefined;
      return {
        id: message.id,
        content: message.content,
        isUser,
        timestamp: message.created_at ? new Date(message.created_at) : new Date(),
        places: parsedPlaces && parsedPlaces.length > 0 ? parsedPlaces : undefined,
      };
    });

    if (user && mapped.length > 0) {
      const allPlaceNames: string[] = [];
      const allPlaceIds: string[] = [];

      mapped.forEach(msg => {
        if (msg.places) {
          msg.places.forEach(place => {
            allPlaceNames.push(place.name);
            allPlaceIds.push(place.id);
          });
        }
      });

      if (allPlaceNames.length > 0) {
        const reactions = await getUserReactionsForPlaces(user.id, allPlaceNames, allPlaceIds);
        setUserReactions(prev => ({ ...prev, ...reactions.byName }));
        setUserReactionsById(prev => ({ ...prev, ...reactions.byId }));
      }
    }

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

      const response = await sendChatMessage(conversationHistory, systemPrompt);

      if (response.error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Sorry, I encountered an error: ${response.error}. Please try again later.`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const parsedPlaces = parsePlacesFromResponse(response.content);

        let reactions = { byName: {} as Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>, byId: {} as Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }> };

        if (user && parsedPlaces.length > 0) {
          const placeNames = parsedPlaces.map(p => p.name);
          const placeIds = parsedPlaces.map(p => p.id);
          reactions = await getUserReactionsForPlaces(user.id, placeNames, placeIds);
          setUserReactions(prev => ({ ...prev, ...reactions.byName }));
          setUserReactionsById(prev => ({ ...prev, ...reactions.byId }));
        }

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: response.content,
          isUser: false,
          timestamp: new Date(),
          places: parsedPlaces,
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
    setMessages([createInitialMessage(cityName)]);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
      setMessages([createInitialMessage(cityName)]);
    }

    toast({ title: "Chat deleted" });
    setSessionToDelete(null);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-16 flex min-h-0 overflow-hidden relative">
        {/* Sidebar - Chat History */ }
        <motion.div
          initial={ false }
          animate={ {
            width: isSidebarOpen ? 256 : 0,
            opacity: isSidebarOpen ? 1 : 0,
          } }
          transition={ { duration: 0.2, ease: "easeInOut" } }
          className="border-r border-border bg-card/30 flex flex-col min-h-0 overflow-hidden"
          style={ { minWidth: isSidebarOpen ? 256 : 0 } }
        >
          { isSidebarOpen && (
            <>
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-foreground">Chat History</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={ () => {
                      const newState = !isSidebarOpen;
                      setIsSidebarOpen(newState);
                      localStorage.setItem('chat_sidebar_open', JSON.stringify(newState));
                    } }
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  { sessions.length > 0 ? `${sessions.length} chats` : "No chats yet" }
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
            </>
          ) }
        </motion.div>

        {/* Button to expand sidebar when collapsed */ }
        { !isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 absolute left-2 top-20 z-10 bg-card/80 backdrop-blur-sm border border-border shadow-sm"
            onClick={ () => {
              const newState = !isSidebarOpen;
              setIsSidebarOpen(newState);
              localStorage.setItem('chat_sidebar_open', JSON.stringify(newState));
            } }
          >
            <PanelLeftOpen className="h-5 w-5" />
          </Button>
        ) }

        {/* Main Chat Area */ }
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */ }
          <div className="border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-coral rounded-xl flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-charcoal-dark" />
                  </div>
                  <div>
                    <h1 className="font-display font-semibold text-foreground">Chat with The Piggy</h1>
                    <p className="text-sm text-muted-foreground">
                      { selectedSession ? selectedSession.title || "New Chat" : "New Chat" }
                    </p>
                  </div>
                </div>
                <Button
                  variant={ useLiveLocation ? "default" : "outline" }
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={ handleToggleLiveLocation }
                  disabled={ isLoadingLocation }
                >
                  { isLoadingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : useLiveLocation ? (
                    <>
                      <Navigation className="h-4 w-4" />
                      <span>Live Location</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      <span>Home City</span>
                    </>
                  ) }
                </Button>
              </div>
              { useLiveLocation && liveCity && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  <span>Using location: { liveCity }</span>
                </div>
              ) }
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
                  { messages.map((message) => {
                    const contentWithoutPlaces = message.places && message.places.length > 0
                      ? message.content
                        .replace(/\*\*([^*]+)\*\*\s*(\$+)\s*❤️➕👍👎\s*\n([^\n]+)\s*\n🐖\s*\|\s*👍(\d+)%\s*\|\s*❤️(\d+)x\s*/gi, '')
                        .replace(/\n{3,}/g, '\n\n')
                        .replace(/^\s+|\s+$/g, '')
                      : message.content;

                    return (
                      <div key={ message.id }>
                        <ChatMessage
                          content={ contentWithoutPlaces }
                          isUser={ message.isUser }
                          timestamp={ message.timestamp }
                        />
                        {/* Place Items in new format */ }
                        { message.places && message.places.length > 0 && (
                          <motion.div
                            initial={ { opacity: 0, y: 10 } }
                            animate={ { opacity: 1, y: 0 } }
                            className={ cn(
                              "mt-4",
                              !message.isUser && "ml-12"
                            ) }
                          >
                            { message.places.map((place) => (
                              <ChatPlaceItem
                                key={ place.id }
                                placeId={ place.id }
                                name={ place.name }
                                address={ place.address }
                                price={ place.price }
                                sentiment={ place.sentiment }
                                likesCount={ place.likesCount }
                                dislikeCount={ place.dislikeCount }
                                favouritesCount={ place.favouritesCount }
                                piggyPoints={ place.piggyPoints }
                                userReactions={ userReactionsById[place.id] || userReactions[place.name] }
                                onReactionUpdate={ async () => {
                                  if (user) {
                                    const reactions = await getUserReactionsForPlaces(
                                      user.id,
                                      [place.name],
                                      [place.id]
                                    );
                                    setUserReactions(prev => ({ ...prev, ...reactions.byName }));
                                    setUserReactionsById(prev => ({ ...prev, ...reactions.byId }));

                                    setTimeout(async () => {
                                      const { data } = await supabase
                                        .from('places')
                                        .select('likes_count, favourites_count, want_to_go_count, dislike_count')
                                        .eq('id', place.id)
                                        .single();

                                      if (data) {
                                        const likesCount = (data as any).likes_count || 0;
                                        const dislikeCount = (data as any).dislike_count || 0;
                                        const favouritesCount = (data as any).favourites_count || 0;
                                        const total = likesCount + dislikeCount;
                                        const likesPercentage = total > 0 ? Math.round((likesCount / total) * 100) : 0;

                                        setMessages(prev => prev.map(msg => {
                                          if (msg.id === message.id && msg.places) {
                                            return {
                                              ...msg,
                                              places: msg.places.map(p =>
                                                p.id === place.id ? {
                                                  ...p,
                                                  likesCount,
                                                  dislikeCount,
                                                  favouritesCount,
                                                  sentiment: likesPercentage,
                                                } : p
                                              ),
                                            };
                                          }
                                          return msg;
                                        }));
                                      }
                                    }, 200);
                                  }
                                } }
                              />
                            )) }
                          </motion.div>
                        ) }
                      </div>
                    );
                  }) }
                </AnimatePresence>
                <div ref={ messagesEndRef } />

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
              <ChatInput
                onSend={ handleSend }
                disabled={ isTyping }
                cityName={ homeCity ? homeCity.split(',')[0] : undefined }
              />
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
