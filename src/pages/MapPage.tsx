import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { FilterBar } from "@/components/filters/FilterBar";
import { PlaceCard } from "@/components/place/PlaceCard";
import { Button } from "@/components/ui/button";
import { Map, Grid3X3, Navigation, Locate } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import { getMapboxToken, getMapConfig, DEFAULT_ZOOM } from "@/integrations/mapbox/client";
import { useAuth } from "@/hooks/useAuth";
import { getUserReactionsForPlaces, toggleReactionForPlace } from "@/hooks/useReactions";
import { useCuisineReactions, type CuisineReactions } from "@/hooks/useCuisineReactions";
import { usePlaces, type Place } from "@/hooks/usePlaces";
import { supabase } from "@/integrations/supabase/client";

type ViewMode = "map" | "cards";

const CASABLANCA_CENTER: [number, number] = [-7.5898, 33.5731];

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

type PlaceWithDistance = Place & { distance?: number };

function extractCityFromAddress(address: string): string | null {
  if (!address) return null;

  const parts = address.split(',').map(p => p.trim());
  if (parts.length < 2) return null;

  // Для адресов типа "Street, City, State ZIP, Country" или "Street, City, Country"
  // Пытаемся найти город - обычно это предпоследний элемент, но если предпоследний выглядит как ZIP/State, берем третий с конца
  if (parts.length >= 3) {
    const secondLast = parts[parts.length - 2];
    // Если предпоследний элемент выглядит как ZIP код или штат (содержит цифры или короткий), берем третий с конца
    if (/^\d+/.test(secondLast) || secondLast.length <= 5) {
      if (parts.length >= 3) {
        return parts[parts.length - 3];
      }
    } else {
      return secondLast;
    }
  }

  // Если только 2 части, город - это первая часть
  if (parts.length === 2) {
    return parts[0];
  }

  return null;
}

function normalizeCityName(cityName: string): string {
  // Нормализуем названия городов для сравнения
  return cityName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Заменяем альтернативные названия
    .replace(/kiev/g, 'kyiv')
    .replace(/moscow/g, 'moskva');
}

function matchesHomeCity(place: Place, homeCity: string | null): boolean {
  if (!homeCity) return true;

  // homeCity в формате "City, Country" (например, "Kyiv, Ukraine")
  const parts = homeCity.split(',').map(p => p.trim());
  const homeCityName = parts[0].trim().toLowerCase();
  const homeCountryName = parts.length > 1 ? parts[1].trim().toLowerCase() : null;

  // Точное сравнение города (case-insensitive)
  let cityMatches = false;

  if (place.city) {
    const placeCityName = place.city.trim().toLowerCase();
    // Только точное совпадение
    if (placeCityName === homeCityName) {
      cityMatches = true;
    }
  } else {
    // Fallback: парсим адрес, если city не указан
    const cityFromAddress = extractCityFromAddress(place.address);
    if (cityFromAddress) {
      const addressCityName = cityFromAddress.trim().toLowerCase();
      if (addressCityName === homeCityName) {
        cityMatches = true;
      }
    }
  }

  if (!cityMatches) return false;

  // Если указана страна, проверяем точное совпадение страны
  if (homeCountryName && place.country) {
    const placeCountryName = place.country.trim().toLowerCase();
    // Только точное совпадение страны
    if (placeCountryName !== homeCountryName) {
      return false; // Город совпадает, но страна не совпадает
    }
  }

  return true; // Город совпадает, и страна либо не указана, либо совпадает
}

function filterPlaces(
  places: Place[],
  filters: Record<string, string[]>,
  userReactions: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>,
  cuisineReactions: CuisineReactions,
  userLocation?: { latitude: number; longitude: number },
  sortByNearest?: boolean,
  homeCity?: string | null
): PlaceWithDistance[] {
  // Места уже отфильтрованы по городу на уровне базы данных в usePlaces
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
  }).map((place): PlaceWithDistance => {
    // Add distance to place if user location is available
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      );
      return { ...place, distance };
    }
    return place;
  }).filter((place) => {
    // Filter by 20km radius if nearest is enabled
    if (sortByNearest && userLocation && place.distance !== undefined) {
      return place.distance <= 20; // 20km radius
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

    // Sort by distance if sortByNearest is enabled and both places have distance
    if (sortByNearest && a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });
}

export default function MapPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [userReactions, setUserReactions] = useState<Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>>({});
  const { cuisineReactions } = useCuisineReactions();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isNearestEnabled, setIsNearestEnabled] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [homeCity, setHomeCity] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Загружаем места из Supabase с фильтрацией по городу
  const { places: allPlaces, loading: isLoadingPlaces } = usePlaces(homeCity);

  useEffect(() => {
    const listParam = searchParams.get('list');
    if (listParam && (listParam === 'favourites' || listParam === 'want_to_go')) {
      setFilters(prev => ({
        ...prev,
        list: [listParam],
      }));
    }
  }, [searchParams]);

  const loadLocalStorageReactions = useCallback(() => {
    try {
      const reactions = localStorage.getItem('place_reactions');
      if (!reactions) return;

      const parsed = JSON.parse(reactions);
      const result: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }> = {};

      allPlaces.forEach(place => {
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
  }, [allPlaces]);

  const loadUserReactions = useCallback(async () => {
    if (!user) return;

    try {
      const placeNames = allPlaces.map(p => p.name);
      const reactions = await getUserReactionsForPlaces(user.id, placeNames);
      setUserReactions(reactions);
    } catch (error) {
      console.error('Error loading user reactions:', error);
      loadLocalStorageReactions();
    }
  }, [user, allPlaces, loadLocalStorageReactions]);

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

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsNearestEnabled(true);
        setIsLoadingLocation(false);
      },
      (error) => {
        setLocationError("Unable to get your location. Please enable location services.");
        setIsLoadingLocation(false);
        setIsNearestEnabled(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleNearestToggle = useCallback(() => {
    if (isNearestEnabled) {
      setIsNearestEnabled(false);
      setUserLocation(null);
    } else {
      if (userLocation) {
        setIsNearestEnabled(true);
      } else {
        getCurrentLocation();
      }
    }
  }, [isNearestEnabled, userLocation, getCurrentLocation]);

  const filteredPlaces = useMemo(() => {
    // Места уже отфильтрованы по городу в usePlaces, применяем остальные фильтры
    const result = filterPlaces(
      allPlaces,
      filters,
      userReactions,
      cuisineReactions,
      userLocation || undefined,
      isNearestEnabled,
      homeCity
    );

    return result;
  }, [allPlaces, filters, userReactions, cuisineReactions, userLocation, isNearestEnabled, homeCity]);

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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-16 flex flex-col min-h-0 overflow-hidden">
        {/* Filter Bar */ }
        <FilterBar onFilterChange={ handleFilterChange } filters={ filters } />

        {/* View Toggle & Actions */ }
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                { filteredPlaces.length } { filteredPlaces.length === 1 ? "place" : "places" }
                { Object.keys(filters).length > 0 && ` (filtered from ${allPlaces.length})` }
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={ isNearestEnabled ? "default" : "outline" }
                size="sm"
                className={ cn(
                  isNearestEnabled && "bg-primary text-primary-foreground"
                ) }
                onClick={ handleNearestToggle }
                disabled={ isLoadingLocation }
              >
                <Locate className={ cn("h-4 w-4 mr-1", isLoadingLocation && "animate-spin") } />
                { isLoadingLocation ? "Locating..." : "Nearest" }
              </Button>
              { locationError && (
                <span className="text-xs text-destructive">{ locationError }</span>
              ) }

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
              userLocation={ userLocation }
              homeCity={ homeCity }
              isLoadingProfile={ isLoadingProfile }
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <CardsView
                places={ filteredPlaces }
                userReactions={ userReactions }
                onReactionToggle={ handleReactionToggle }
                homeCity={ homeCity }
                isLoadingProfile={ isLoadingProfile }
              />
            </div>
          ) }
        </div>
      </main>
    </div>
  );
}

interface MapViewProps {
  places: Place[];
  userLocation?: { latitude: number; longitude: number } | null;
  homeCity?: string | null;
  isLoadingProfile?: boolean;
}

function MapView({ places, userLocation, homeCity, isLoadingProfile }: MapViewProps) {
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
    // Priority: user location > city center > geocode city > Casablanca center
    let initialCenter: [number, number] = CASABLANCA_CENTER;
    let initialZoom = DEFAULT_ZOOM;

    if (userLocation) {
      initialCenter = [userLocation.longitude, userLocation.latitude];
      initialZoom = 14;
    } else if (cityCenter) {
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

          // Add user location to bounds if available
          if (userLocation) {
            bounds.extend([userLocation.longitude, userLocation.latitude]);
          }

          placesWithCoords.forEach(place => {
            bounds.extend([place.longitude, place.latitude]);
          });

          map.current.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            maxZoom: 14
          });
        } else if (userLocation) {
          // If no places but user location available, center on user location
          map.current.flyTo({
            center: [userLocation.longitude, userLocation.latitude],
            zoom: 14,
          });
        } else if (cityCenter) {
          // Если нет мест, но есть центр города, центрируем на него
          map.current.flyTo({
            center: cityCenter,
            zoom: 12,
          });
        } else {
          // Если нет мест и нет центра города, центрируем на Касабланку
          map.current.setCenter(CASABLANCA_CENTER);
          map.current.setZoom(DEFAULT_ZOOM);
        }
      } else if (userLocation) {
        // If no places but user location available, center on user location
        map.current.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 14,
        });
      } else if (cityCenter) {
        // If no places but city center available, center on city
        map.current.flyTo({
          center: cityCenter,
          zoom: 12,
        });
      } else {
        // Если нет мест и нет центра города, центрируем на Касабланку
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
  }, [places, userLocation, homeCity, cityCenter]);

  // Update map center when cityCenter changes or when places are filtered
  useEffect(() => {
    if (!map.current || !homeCity || userLocation) return;

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
  }, [cityCenter, places, homeCity, userLocation]);

  // Update map center when user location changes
  useEffect(() => {
    if (!map.current || !userLocation) return;

    map.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 14,
      duration: 1000,
    });
  }, [userLocation]);

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
}

interface CardsViewProps {
  places: Place[];
  userReactions: Record<string, { favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }>;
  onReactionToggle: (placeName: string, type: 'heart' | 'bookmark' | 'like' | 'dislike' | null) => void;
  homeCity?: string | null;
  isLoadingProfile?: boolean;
}

function CardsView({ places, userReactions, onReactionToggle, homeCity, isLoadingProfile }: CardsViewProps) {
  if (isLoadingProfile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!homeCity) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
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
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
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
