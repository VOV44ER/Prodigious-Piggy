import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { FilterBar } from "@/components/filters/FilterBar";
import { PlaceCard } from "@/components/place/PlaceCard";
import { Button } from "@/components/ui/button";
import { Map, Grid3X3, Navigation, Locate } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import mapboxgl from "mapbox-gl";
import { getMapboxToken, getMapConfig, DEFAULT_CENTER, DEFAULT_ZOOM } from "@/integrations/mapbox/client";

type ViewMode = "map" | "cards";

interface Place {
  name: string;
  address: string;
  category: string;
  cuisine: string;
  price: 1 | 2 | 3 | 4;
  rating: number;
  sentiment: number;
  imageUrl: string;
  latitude: number;
  longitude: number;
}

const samplePlaces: Place[] = [
  {
    name: "The Ivy Chelsea Garden",
    address: "195 King's Road, London",
    category: "Restaurant",
    cuisine: "British",
    price: 3 as const,
    rating: 4.6,
    sentiment: 87,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    latitude: 51.4886,
    longitude: -0.1694,
  },
  {
    name: "Gordon's Wine Bar",
    address: "47 Villiers St, London",
    category: "Bar",
    cuisine: "Wine Bar",
    price: 2 as const,
    rating: 4.8,
    sentiment: 92,
    imageUrl: "https://images.unsplash.com/photo-1574096079513-d8259312b785?w=400&h=300&fit=crop",
    latitude: 51.5081,
    longitude: -0.1236,
  },
  {
    name: "Koya Bar",
    address: "50 Frith St, London",
    category: "Restaurant",
    cuisine: "Japanese",
    price: 2 as const,
    rating: 4.7,
    sentiment: 95,
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
    latitude: 51.5142,
    longitude: -0.1331,
  },
  {
    name: "Dishoom Covent Garden",
    address: "12 Upper St Martin's Lane",
    category: "Restaurant",
    cuisine: "Indian",
    price: 2 as const,
    rating: 4.7,
    sentiment: 94,
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop",
    latitude: 51.5115,
    longitude: -0.1260,
  },
  {
    name: "Padella",
    address: "1 Phipp St, London",
    category: "Restaurant",
    cuisine: "Italian",
    price: 2 as const,
    rating: 4.8,
    sentiment: 96,
    imageUrl: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=400&h=300&fit=crop",
    latitude: 51.5234,
    longitude: -0.0814,
  },
  {
    name: "The Wolseley",
    address: "160 Piccadilly, London",
    category: "Restaurant",
    cuisine: "European",
    price: 3 as const,
    rating: 4.5,
    sentiment: 88,
    imageUrl: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&h=300&fit=crop",
    latitude: 51.5069,
    longitude: -0.1416,
  },
];

export default function MapPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const handleFilterChange = (newFilters: Record<string, string[]>) => {
    setFilters(newFilters);
    console.log("Filters changed:", newFilters);
  };

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
                { samplePlaces.length } places saved
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
            <MapView places={ samplePlaces } />
          ) : (
            <CardsView places={ samplePlaces } />
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
      center: config.center || DEFAULT_CENTER,
      zoom: config.zoom || DEFAULT_ZOOM,
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

      if (places.length > 0 && places[0].latitude && places[0].longitude) {
        const bounds = new mapboxgl.LngLatBounds();
        places.forEach(place => {
          if (place.latitude && place.longitude) {
            bounds.extend([place.longitude, place.latitude]);
          }
        });
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 14
        });
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

function CardsView({ places }: CardsViewProps) {
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
            <PlaceCard { ...place } />
          </motion.div>
        )) }
      </div>
    </div>
  );
}
