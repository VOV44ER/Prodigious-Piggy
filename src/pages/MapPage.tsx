import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { FilterBar } from "@/components/filters/FilterBar";
import { PlaceCard } from "@/components/place/PlaceCard";
import { Button } from "@/components/ui/button";
import { Map, Grid3X3, Navigation, Locate } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import { getMapboxToken, getMapConfig, DEFAULT_ZOOM } from "@/integrations/mapbox/client";
import { casablancaPlaces, type Place } from "@/data/casablanca-places";
import { useAuth } from "@/hooks/useAuth";
import { getUserReactionsForPlaces, toggleReactionForPlace } from "@/hooks/useReactions";
import { supabase } from "@/integrations/supabase/client";

type ViewMode = "map" | "cards";

const CASABLANCA_CENTER: [number, number] = [-7.5898, 33.5731];

function filterPlaces(
  places: Place[],
  filters: Record<string, string[]>,
  userReactions: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>
): Place[] {
  return places.filter((place) => {
    // Price filter
    if (filters.price && filters.price.length > 0) {
      const priceValues = filters.price.map((p) => parseInt(p, 10));
      if (!priceValues.includes(place.price)) {
        return false;
      }
    }

    // Cuisine filter
    if (filters.cuisine && filters.cuisine.length > 0) {
      const cuisineLower = place.cuisine?.toLowerCase() || "";
      const matches = filters.cuisine.some(
        (filterCuisine) => cuisineLower === filterCuisine.toLowerCase()
      );
      if (!matches) {
        return false;
      }
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      const categoryLower = place.category.toLowerCase();
      const matches = filters.category.some(
        (filterCategory) => categoryLower === filterCategory.toLowerCase()
      );
      if (!matches) {
        return false;
      }
    }

    // Style filter - пока нет в данных, пропускаем

    // List filter (favourites, want_to_go)
    if (filters.list && filters.list.length > 0) {
      const reactions = userReactions[place.name] || { favourites: false, wantToGo: false, like: false, dislike: false };
      const matches = filters.list.some((listType) => {
        if (listType === 'favourites') {
          return reactions.favourites;
        }
        if (listType === 'want_to_go') {
          return reactions.wantToGo;
        }
        return false;
      });
      if (!matches) {
        return false;
      }
    }

    return true;
  });
}

export default function MapPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [userReactions, setUserReactions] = useState<Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>>({});

  const loadLocalStorageReactions = useCallback(() => {
    try {
      const reactions = localStorage.getItem('place_reactions');
      if (!reactions) return;

      const parsed = JSON.parse(reactions);
      const result: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }> = {};

      casablancaPlaces.forEach(place => {
        const placeReactions = parsed[place.name] || {};
        result[place.name] = {
          favourites: placeReactions.heart === true || placeReactions.love === true,
          wantToGo: placeReactions.bookmark === true || placeReactions.want_to_go === true,
          like: placeReactions.like === true,
          dislike: placeReactions.dislike === true,
        };
      });

      setUserReactions(result);
    } catch {
      // Ignore errors
    }
  }, []);

  const loadUserReactions = useCallback(async () => {
    if (!user) return;

    try {
      const placeNames = casablancaPlaces.map(p => p.name);
      const reactions = await getUserReactionsForPlaces(user.id, placeNames);
      setUserReactions(reactions);
    } catch (error) {
      console.error('Error loading user reactions:', error);
      loadLocalStorageReactions();
    }
  }, [user, loadLocalStorageReactions]);

  useEffect(() => {
    if (user) {
      loadUserReactions();

      // Subscribe to changes in user_reactions with debounce
      let timeoutId: NodeJS.Timeout;
      const channel = supabase
        .channel('user_reactions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_reactions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Debounce to prevent multiple rapid calls
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              loadUserReactions();
            }, 300);
          }
        )
        .subscribe();

      return () => {
        clearTimeout(timeoutId);
        supabase.removeChannel(channel);
      };
    } else {
      // Fallback to localStorage if not authenticated
      loadLocalStorageReactions();

      // Listen to localStorage changes (for same-tab updates)
      let timeoutId: NodeJS.Timeout;
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'place_reactions') {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            loadLocalStorageReactions();
          }, 300);
        }
      };

      // Also listen to custom event for same-tab updates
      const handleCustomStorageChange = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          loadLocalStorageReactions();
        }, 300);
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('place_reactions_updated', handleCustomStorageChange);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('place_reactions_updated', handleCustomStorageChange);
      };
    }
  }, [user, loadUserReactions, loadLocalStorageReactions]);


  const handleFilterChange = (newFilters: Record<string, string[]>) => {
    setFilters(newFilters);
  };

  const filteredPlaces = useMemo(() => {
    return filterPlaces(casablancaPlaces, filters, userReactions);
  }, [filters, userReactions]);

  const handleReactionToggle = useCallback(async (placeName: string, type: 'heart' | 'bookmark' | 'like' | 'dislike' | null) => {
    const currentReactions = userReactions[placeName] || { favourites: false, wantToGo: false, like: false, dislike: false };

    // Optimistically update UI
    const newReactions = await toggleReactionForPlace(placeName, currentReactions, type);

    setUserReactions(prev => ({
      ...prev,
      [placeName]: newReactions,
    }));
  }, [userReactions]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16 flex flex-col">
        {/* Filter Bar */ }
        <FilterBar onFilterChange={ handleFilterChange } />

        {/* View Toggle & Actions */ }
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                { filteredPlaces.length } { filteredPlaces.length === 1 ? "place" : "places" }
                { Object.keys(filters).length > 0 && ` (filtered from ${casablancaPlaces.length})` }
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
              >
                <Locate className="h-4 w-4 mr-1" />
                Nearest
              </Button>

              {/* View Toggle */ }
              <div className="flex bg-secondary rounded-lg p-1">
                <button
                  onClick={ () => setViewMode("map") }
                  className={ cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "map"
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  ) }
                >
                  <Map className="h-4 w-4" />
                  Map
                </button>
                <button
                  onClick={ () => setViewMode("cards") }
                  className={ cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "cards"
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  ) }
                >
                  <Grid3X3 className="h-4 w-4" />
                  Cards
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */ }
        <div className="flex-1">
          { viewMode === "map" ? (
            <MapView places={ filteredPlaces } />
          ) : (
            <CardsView
              places={ filteredPlaces }
              userReactions={ userReactions }
              onReactionToggle={ handleReactionToggle }
            />
          ) }
        </div>
      </main>
    </div>
  );
}

interface MapViewProps {
  places: Place[];
}

function MapView({ places }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const token = getMapboxToken();
    if (!token) {
      setMapError("Mapbox token not found. Please add VITE_MAPBOX_TOKEN to .env.local");
      return;
    }

    mapboxgl.accessToken = token;

    const config = getMapConfig(token);
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: config.style || 'mapbox://styles/mapbox/streets-v12',
      center: CASABLANCA_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      places.forEach((place) => {
        if (place.latitude && place.longitude) {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = 'hsl(var(--primary))';
          el.style.border = '3px solid white';
          el.style.cursor = 'pointer';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

          const marker = new mapboxgl.Marker(el)
            .setLngLat([place.longitude, place.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="min-width: 200px;">
                    <h3 style="font-weight: 600; margin: 0 0 4px 0; font-size: 16px;">${place.name}</h3>
                    <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${place.address}</p>
                    <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center;">
                      <span style="background: hsl(var(--primary)); color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                        ⭐ ${place.rating}
                      </span>
                      <span style="color: #666; font-size: 12px;">${place.category}</span>
                    </div>
                  </div>
                `)
            )
            .addTo(map.current);

          markersRef.current.push(marker);
        }
      });

      if (places.length > 0) {
        const placesWithCoords = places.filter(p => p.latitude && p.longitude);
        if (placesWithCoords.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          placesWithCoords.forEach(place => {
            bounds.extend([place.longitude, place.latitude]);
          });
          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 14
          });
        }
      } else {
        // Если нет мест, центрируем на Касабланку
        map.current.setCenter(CASABLANCA_CENTER);
        map.current.setZoom(DEFAULT_ZOOM);
      }
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      if (map.current) {
        map.current.remove();
      }
    };
  }, [places]);

  if (mapError) {
    return (
      <div className="h-full min-h-[calc(100vh-200px)] relative bg-muted flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Navigation className="h-10 w-10 text-destructive" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            Map Loading Error
          </h3>
          <p className="text-muted-foreground max-w-sm">
            { mapError }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[calc(100vh-200px)] relative">
      <div ref={ mapContainer } className="absolute inset-0 w-full h-full" />
    </div>
  );
}

interface CardsViewProps {
  places: Place[];
}

interface CardsViewProps {
  places: Place[];
  userReactions: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>;
  onReactionToggle: (placeName: string, type: 'heart' | 'bookmark' | 'like' | 'dislike' | null) => void;
}

function CardsView({ places, userReactions, onReactionToggle }: CardsViewProps) {
  if (places.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            No places found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your filters to see more results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        { places.map((place, index) => (
          <motion.div
            key={ place.name }
            initial={ { opacity: 0, y: 20 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { delay: index * 0.05 } }
          >
            <PlaceCard
              { ...place }
              reactions={ userReactions[place.name] }
              onReactionToggle={ onReactionToggle }
            />
          </motion.div>
        )) }
      </div>
    </div>
  );
}
