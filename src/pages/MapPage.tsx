import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { FilterBar } from "@/components/filters/FilterBar";
import { PlaceCard } from "@/components/place/PlaceCard";
import { Button } from "@/components/ui/button";
import { Map, Grid3X3, Navigation, Locate } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type ViewMode = "map" | "cards";

const samplePlaces = [
  {
    name: "The Ivy Chelsea Garden",
    address: "195 King's Road, London",
    category: "Restaurant",
    cuisine: "British",
    price: 3 as const,
    rating: 4.6,
    sentiment: 87,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
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
        {/* Filter Bar */}
        <FilterBar onFilterChange={handleFilterChange} />

        {/* View Toggle & Actions */}
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {samplePlaces.length} places saved
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

              {/* View Toggle */}
              <div className="flex bg-secondary rounded-lg p-1">
                <button
                  onClick={() => setViewMode("map")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "map"
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Map className="h-4 w-4" />
                  Map
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "cards"
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Cards
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {viewMode === "map" ? (
            <MapView />
          ) : (
            <CardsView places={samplePlaces} />
          )}
        </div>
      </main>
    </div>
  );
}

function MapView() {
  return (
    <div className="h-full min-h-[calc(100vh-200px)] relative bg-muted">
      {/* Placeholder map */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Navigation className="h-10 w-10 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            Map View Coming Soon
          </h3>
          <p className="text-muted-foreground max-w-sm">
            Interactive Mapbox integration will display your saved places with smart clustering and filters.
          </p>
        </div>
      </div>

      {/* Decorative map pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
}

interface CardsViewProps {
  places: typeof samplePlaces;
}

function CardsView({ places }: CardsViewProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {places.map((place, index) => (
          <motion.div
            key={place.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PlaceCard {...place} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
