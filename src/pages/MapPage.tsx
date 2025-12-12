import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { FilterBar } from "@/components/filters/FilterBar";
import { PlaceCard } from "@/components/place/PlaceCard";
import { CityCombobox } from "@/components/CityCombobox";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Map, Grid3X3, Navigation, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import { getMapboxToken, getMapConfig, DEFAULT_ZOOM } from "@/integrations/mapbox/client";
import { useAuth } from "@/hooks/useAuth";
import { getUserReactionsForPlaces, toggleReactionForPlace } from "@/hooks/useReactions";
import { useCuisineReactions, type CuisineReactions } from "@/hooks/useCuisineReactions";
import { usePlaces, type Place } from "@/hooks/usePlaces";
import { supabase } from "@/integrations/supabase/client";
import { getPlaceIconUrl } from "@/lib/place-icons";

type ViewMode = "map" | "cards";

const CASABLANCA_CENTER: [number, number] = [-7.5898, 33.5731];



function extractCityFromAddress(address: string): string | null {
  if (!address) return null;

  const parts = address.split(',').map(p => p.trim());
  if (parts.length < 2) return null;

  // For addresses like "Street, City, State ZIP, Country" or "Street, City, Country"
  // Try to find the city - usually it's the second-to-last element, but if the second-to-last looks like ZIP/State, take the third from the end
  if (parts.length >= 3) {
    const secondLast = parts[parts.length - 2];
    // If the second-to-last element looks like a ZIP code or state (contains numbers or is short), take the third from the end
    if (/^\d+/.test(secondLast) || secondLast.length <= 5) {
      if (parts.length >= 3) {
        return parts[parts.length - 3];
      }
    } else {
      return secondLast;
    }
  }

  // If only 2 parts, the city is the first part
  if (parts.length === 2) {
    return parts[0];
  }

  return null;
}

function normalizeCityName(cityName: string): string {
  // Normalize city names for comparison
  return cityName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Replace alternative names
    .replace(/kiev/g, 'kyiv')
    .replace(/moscow/g, 'moskva');
}

function matchesHomeCity(place: Place, homeCity: string | null): boolean {
  if (!homeCity) return true;

  // homeCity in format "City, Country" (e.g., "Kyiv, Ukraine")
  const parts = homeCity.split(',').map(p => p.trim());
  const homeCityName = parts[0].trim().toLowerCase();
  const homeCountryName = parts.length > 1 ? parts[1].trim().toLowerCase() : null;

  // Exact city comparison (case-insensitive)
  let cityMatches = false;

  if (place.city) {
    const placeCityName = place.city.trim().toLowerCase();
    // Only exact match
    if (placeCityName === homeCityName) {
      cityMatches = true;
    }
  } else {
    // Fallback: parse address if city is not specified
    const cityFromAddress = extractCityFromAddress(place.address);
    if (cityFromAddress) {
      const addressCityName = cityFromAddress.trim().toLowerCase();
      if (addressCityName === homeCityName) {
        cityMatches = true;
      }
    }
  }

  if (!cityMatches) return false;

  // If country is specified, check exact country match
  if (homeCountryName && place.country) {
    const placeCountryName = place.country.trim().toLowerCase();
    // Only exact country match
    if (placeCountryName !== homeCountryName) {
      return false; // City matches but country doesn't
    }
  }

  return true; // City matches, and country is either not specified or matches
}

function filterPlaces(
  places: Place[],
  filters: Record<string, string[]>,
  userReactions: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>,
  userReactionsById: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>,
  cuisineReactions: CuisineReactions,
  homeCity?: string | null
): Place[] {
  // Places are already filtered by city at the database level in usePlaces
  return places.filter((place) => {

    // Exclude places with disliked cuisines
    if (place.cuisine) {
      const cuisineReaction = cuisineReactions[place.cuisine];
      if (cuisineReaction === 'dislike') {
        return false;
      }
    }

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

    // Style filter - not available in data yet, skip

    // List filter (favourites, want_to_go) - используем ID для точности
    if (filters.list && filters.list.length > 0) {
      const reactions = userReactionsById[place.id] || userReactions[place.name];

      if (!reactions) {
        return false;
      }

      const hasFavourites = reactions.favourites === true;
      const hasWantToGo = reactions.wantToGo === true;

      let hasMatch = false;
      for (const listType of filters.list) {
        if (listType === 'favourites' && hasFavourites) {
          hasMatch = true;
          break;
        }
        if (listType === 'want_to_go' && hasWantToGo) {
          hasMatch = true;
          break;
        }
      }

      if (!hasMatch) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    // Prioritize places with liked cuisines
    const aCuisineReaction = a.cuisine ? cuisineReactions[a.cuisine] : null;
    const bCuisineReaction = b.cuisine ? cuisineReactions[b.cuisine] : null;

    if (aCuisineReaction === 'like' && bCuisineReaction !== 'like') {
      return -1;
    }
    if (bCuisineReaction === 'like' && aCuisineReaction !== 'like') {
      return 1;
    }

    return 0;
  });
}

export default function MapPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    const initialListParam = new URLSearchParams(window.location.search).get('list');
    if (initialListParam && (initialListParam === 'favourites' || initialListParam === 'want_to_go')) {
      return { list: [initialListParam] };
    }
    return {};
  });
  const [userReactions, setUserReactions] = useState<Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>>({});
  const [userReactionsById, setUserReactionsById] = useState<Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>>({});
  const { cuisineReactions } = useCuisineReactions();
  const [homeCity, setHomeCity] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Use currentCity for places, fallback to homeCity
  const cityForPlaces = currentCity || homeCity;
  const { places: allPlaces, loading: isLoadingPlaces } = usePlaces(cityForPlaces);

  // Update currentCity when homeCity changes
  useEffect(() => {
    if (homeCity && !currentCity) {
      setCurrentCity(homeCity);
    }
  }, [homeCity, currentCity]);

  const isUpdatingFromFilterBar = useRef(false);

  useEffect(() => {
    if (isUpdatingFromFilterBar.current) {
      isUpdatingFromFilterBar.current = false;
      return;
    }

    const listParam = searchParams.get('list');
    if (listParam && (listParam === 'favourites' || listParam === 'want_to_go')) {
      setFilters(prev => {
        if (prev.list && prev.list.length === 1 && prev.list[0] === listParam) {
          return prev;
        }
        return {
          ...prev,
          list: [listParam],
        };
      });
    } else {
      setFilters(prev => {
        if (!prev.list) {
          return prev;
        }
        const newFilters = { ...prev };
        delete newFilters.list;
        return newFilters;
      });
    }
  }, [searchParams]);

  const loadUserReactions = useCallback(async () => {
    if (!user) return;

    try {
      const placeNames = allPlaces.map(p => p.name);
      const placeIds = allPlaces.map(p => p.id);
      const reactions = await getUserReactionsForPlaces(user.id, placeNames, placeIds);

      setUserReactions(reactions.byName);
      setUserReactionsById(reactions.byId);
    } catch (error) {
      console.error('Error loading user reactions:', error);
    }
  }, [user, allPlaces]);

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

  useEffect(() => {
    loadUserProfile();

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
    }
  }, [user, loadUserReactions]);


  const handleFilterChange = useCallback((newFilters: Record<string, string[]>) => {
    isUpdatingFromFilterBar.current = true;

    const cleanedFilters: Record<string, string[]> = {};

    Object.keys(newFilters).forEach(key => {
      if (key === 'list') {
        if (newFilters.list && newFilters.list.length > 0) {
          cleanedFilters.list = [newFilters.list[0]];
        }
      } else {
        cleanedFilters[key] = newFilters[key];
      }
    });

    const newSearchParams = new URLSearchParams(searchParams);

    if (cleanedFilters.list && cleanedFilters.list.length > 0) {
      newSearchParams.set('list', cleanedFilters.list[0]);
    } else {
      newSearchParams.delete('list');
    }

    setFilters(cleanedFilters);
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams]);

  const filteredPlaces = useMemo(() => {
    if (!allPlaces || allPlaces.length === 0) {
      return [];
    }

    if (filters.list && filters.list.length > 0 && Object.keys(userReactionsById).length === 0 && Object.keys(userReactions).length === 0 && user) {
      return [];
    }

    const result = filterPlaces(
      allPlaces,
      filters,
      userReactions,
      userReactionsById,
      cuisineReactions,
      homeCity
    );

    return result;
  }, [allPlaces, filters, userReactions, userReactionsById, cuisineReactions, homeCity, user]);

  const handleReactionToggle = useCallback(async (placeName: string, type: 'heart' | 'bookmark' | 'like' | 'dislike' | null, placeId?: string) => {
    // Используем реакции по ID если доступны, иначе по имени
    const currentReactions = placeId && userReactionsById[placeId]
      ? userReactionsById[placeId]
      : userReactions[placeName] || { favourites: false, wantToGo: false, like: false, dislike: false };

    // Optimistically update UI
    const newReactions = await toggleReactionForPlace(placeName, currentReactions, type, placeId);

    // ВАЖНО: Обновляем только по ID, чтобы избежать проблем с дубликатами имен
    if (placeId) {
      setUserReactionsById(prev => ({
        ...prev,
        [placeId]: newReactions,
      }));

      // Обновляем по имени только если это уникальное имя (нет других мест с таким именем)
      const placesWithSameName = allPlaces.filter(p => p.name === placeName);
      if (placesWithSameName.length === 1) {
        setUserReactions(prev => ({
          ...prev,
          [placeName]: newReactions,
        }));
      }
    } else {
      // Fallback: если нет ID, обновляем по имени (но это не должно происходить)
      setUserReactions(prev => ({
        ...prev,
        [placeName]: newReactions,
      }));
    }

    // Reload reactions from database to ensure sync
    if (user) {
      setTimeout(() => {
        loadUserReactions();
      }, 100);
    }

    // Dispatch event to sync with profile
    window.dispatchEvent(new Event('place_reactions_updated'));
  }, [userReactions, userReactionsById, allPlaces, user, loadUserReactions]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-16 flex flex-col min-h-0 overflow-hidden">
        {/* Filter Bar */ }
        <FilterBar onFilterChange={ handleFilterChange } filters={ filters } />

        {/* View Toggle & Actions */ }
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-[200px]">
                  <CityCombobox
                    value={ currentCity || "" }
                    onValueChange={ setCurrentCity }
                    placeholder="Select city..."
                  />
                </div>
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                { filteredPlaces.length } { filteredPlaces.length === 1 ? "place" : "places" }
                { Object.keys(filters).length > 0 && ` (filtered from ${allPlaces.length})` }
              </span>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
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
        <div className="flex-1 overflow-hidden">
          { viewMode === "map" ? (
            <MapView
              places={ filteredPlaces }
              homeCity={ cityForPlaces }
              isLoadingProfile={ isLoadingProfile }
            />
          ) : (
            <CardsView
              places={ filteredPlaces }
              userReactions={ userReactions }
              userReactionsById={ userReactionsById }
              onReactionToggle={ handleReactionToggle }
              homeCity={ cityForPlaces }
              isLoadingProfile={ isLoadingProfile }
            />
          ) }
        </div>
      </main>
    </div>
  );
}

interface MapViewProps {
  places: Place[];
  homeCity?: string | null;
  isLoadingProfile?: boolean;
}

function MapView({ places, homeCity, isLoadingProfile }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [cityCenter, setCityCenter] = useState<[number, number] | null>(null);

  // Get city center from places or geocode
  useEffect(() => {
    if (!homeCity || places.length === 0) {
      setCityCenter(null);
      return;
    }

    // Try to get center from places first
    const placesWithCoords = places.filter(p => p.latitude && p.longitude);
    if (placesWithCoords.length > 0) {
      // Calculate average center
      const avgLat = placesWithCoords.reduce((sum, p) => sum + p.latitude, 0) / placesWithCoords.length;
      const avgLng = placesWithCoords.reduce((sum, p) => sum + p.longitude, 0) / placesWithCoords.length;
      setCityCenter([avgLng, avgLat]);
      return;
    }

    // If no places with coords, try to geocode the city
    const token = getMapboxToken();
    if (!token) {
      setCityCenter(null);
      return;
    }

    const cityName = homeCity.split(',')[0].trim();
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${token}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setCityCenter([lng, lat]);
        } else {
          setCityCenter(null);
        }
      })
      .catch(() => {
        setCityCenter(null);
      });
  }, [homeCity, places]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Если нет home city, не создаем карту (покажем пустое состояние)
    if (!homeCity) return;

    const token = getMapboxToken();
    if (!token) {
      setMapError("Mapbox token not found. Please add VITE_MAPBOX_TOKEN to .env.local");
      return;
    }

    mapboxgl.accessToken = token;

    const config = getMapConfig(token);
    // Priority: city center > geocode city > Casablanca center
    let initialCenter: [number, number] = CASABLANCA_CENTER;
    let initialZoom = DEFAULT_ZOOM;

    if (cityCenter) {
      initialCenter = cityCenter;
      initialZoom = 12;
    } else if (homeCity) {
      // Если cityCenter еще не загружен, попробуем геокодировать сразу
      const cityName = homeCity.split(',')[0].trim();
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${token}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            const [lng, lat] = data.features[0].center;
            if (map.current) {
              map.current.flyTo({
                center: [lng, lat],
                zoom: 12,
                duration: 1000
              });
            }
          }
        })
        .catch(() => { });
    }

    // Создаем карту только если еще не создана
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: config.style || 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom,
      });

    }

    // Обработчик загрузки карты для добавления маркеров и контролов
    const handleMapLoad = () => {
      if (!map.current) return;

      // Добавляем контролы навигации только один раз
      try {
        if (!map.current.getControl('navigation')) {
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }
      } catch (error) {
        // Игнорируем ошибки, если контрол уже добавлен или карта не готова
      }

      // Добавляем контролы навигации только один раз
      try {
        if (map.current && !map.current.getControl('navigation')) {
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }
      } catch (error) {
        // Игнорируем ошибки, если контрол уже добавлен или карта не готова
      }

      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      places.forEach((place) => {
        if (place.latitude && place.longitude) {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '40px';
          el.style.height = '40px';
          el.style.cursor = 'pointer';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.background = 'white';
          el.style.borderRadius = '50%';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          el.style.padding = '4px';

          const iconUrl = getPlaceIconUrl(place.category);
          const img = document.createElement('img');
          img.src = iconUrl;
          img.style.width = '28px';
          img.style.height = '28px';
          img.style.objectFit = 'contain';
          el.appendChild(img);

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
        } else if (cityCenter) {
          // If no places but city center available, center on city
          map.current.flyTo({
            center: cityCenter,
            zoom: 12,
          });
        } else {
          // If no places and no city center, center on Casablanca
          map.current.setCenter(CASABLANCA_CENTER);
          map.current.setZoom(DEFAULT_ZOOM);
        }
      } else if (cityCenter) {
        // If no places but city center available, center on city
        map.current.flyTo({
          center: cityCenter,
          zoom: 12,
        });
      } else {
        // If no places and no city center, center on Casablanca
        map.current.setCenter(CASABLANCA_CENTER);
        map.current.setZoom(DEFAULT_ZOOM);
      }
    };

    // Подписываемся на событие загрузки карты
    if (map.current.loaded()) {
      // Если карта уже загружена, сразу вызываем обработчик
      handleMapLoad();
    } else {
      // Если карта еще не загружена, ждем события load
      map.current.once('load', handleMapLoad);
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [places, homeCity, cityCenter]);

  // Update map center when cityCenter changes or when places are filtered
  useEffect(() => {
    if (!map.current || !homeCity) return;

    // Если есть отфильтрованные места, используем их для центрирования
    if (places.length > 0) {
      const placesWithCoords = places.filter(p => p.latitude && p.longitude);
      if (placesWithCoords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        placesWithCoords.forEach(place => {
          bounds.extend([place.longitude, place.latitude]);
        });
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 14,
          duration: 1000
        });
        return;
      }
    }

    // Если нет мест, но есть cityCenter, центрируем на него
    if (cityCenter) {
      map.current.flyTo({
        center: cityCenter,
        zoom: 12,
        duration: 1000
      });
    }
  }, [cityCenter, places, homeCity]);

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

  if (isLoadingProfile) {
    return (
      <div className="h-full min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!homeCity) {
    return (
      <div className="h-full min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            No home city set
          </h3>
          <p className="text-muted-foreground mb-4">
            Please set your home city in your profile settings to see places near you.
          </p>
          <Button asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="h-full min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            No places found in { homeCity.split(',')[0] }
          </h3>
          <p className="text-muted-foreground">
            We don't have any places in your home city yet. Try adjusting your filters or check back later.
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
  userReactions: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>;
  userReactionsById: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>;
  onReactionToggle: (placeName: string, type: 'heart' | 'bookmark' | 'like' | 'dislike' | null, placeId?: string) => void;
  homeCity?: string | null;
  isLoadingProfile?: boolean;
}

function CardsView({ places, userReactions, userReactionsById, onReactionToggle, homeCity, isLoadingProfile }: CardsViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [pageInput, setPageInput] = useState("");

  const totalPages = Math.ceil(places.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlaces = places.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
    setPageInput("");
  }, [places.length, itemsPerPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPageInput(value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const page = parseInt(pageInput, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        setPageInput("");
      }
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10));
  };

  if (isLoadingProfile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!homeCity) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            No home city set
          </h3>
          <p className="text-muted-foreground mb-4">
            Please set your home city in your profile settings to see places near you.
          </p>
          <Button asChild>
            <Link to="/settings">Go to Settings</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (places.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Map className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            No places found in { homeCity.split(',')[0] }
          </h3>
          <p className="text-muted-foreground">
            We don't have any places in your home city yet. Try adjusting your filters or check back later.
          </p>
        </div>
      </div>
    );
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            { paginatedPlaces.map((place, index) => (
              <motion.div
                key={ place.id }
                initial={ { opacity: 0, y: 20 } }
                animate={ { opacity: 1, y: 0 } }
                transition={ { delay: index * 0.05 } }
              >
                <PlaceCard
                  { ...place }
                  reactions={ userReactionsById[place.id] || userReactions[place.name] }
                  onReactionToggle={ onReactionToggle }
                />
              </motion.div>
            )) }
          </div>
        </div>
      </div>

      { places.length > 0 && (
        <div className="border-t border-border bg-card/50 py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Items per page:
                </span>
                <Select value={ itemsPerPage.toString() } onValueChange={ handleItemsPerPageChange }>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="120">120</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              { totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="default"
                        onClick={ () => setCurrentPage(prev => Math.max(1, prev - 1)) }
                        disabled={ currentPage === 1 }
                        className="gap-1 pl-2.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </Button>
                    </PaginationItem>

                    { getPageNumbers().map((page, index) => (
                      <PaginationItem key={ index }>
                        { page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <Button
                            variant={ currentPage === page ? "outline" : "ghost" }
                            size="icon"
                            onClick={ () => setCurrentPage(page as number) }
                            className={ cn(
                              "h-9 w-9",
                              currentPage === page && "bg-background"
                            ) }
                          >
                            { page }
                          </Button>
                        ) }
                      </PaginationItem>
                    )) }

                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="default"
                        onClick={ () => setCurrentPage(prev => Math.min(totalPages, prev + 1)) }
                        disabled={ currentPage === totalPages }
                        className="gap-1 pr-2.5"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) }

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Page:
                </span>
                <Input
                  type="number"
                  min={ 1 }
                  max={ totalPages }
                  value={ pageInput }
                  onChange={ handlePageInputChange }
                  onKeyDown={ handlePageInputKeyDown }
                  placeholder={ currentPage.toString() }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  of { totalPages }
                </span>
              </div>
            </div>
          </div>
        </div>
      ) }
    </div>
  );
}
