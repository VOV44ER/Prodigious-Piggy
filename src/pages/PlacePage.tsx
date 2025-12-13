import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import {
  ArrowLeft,
  MapPin,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { usePlace } from "@/hooks/usePlace";
import { getPlaceImageUrl } from "@/lib/place-images";
import mapboxgl from "mapbox-gl";
import { getMapboxToken, getMapConfig } from "@/integrations/mapbox/client";
import { getPlaceIconUrl } from "@/lib/place-icons";

export default function PlacePage() {
  const { slug } = useParams();
  const { place, loading, error } = usePlace(slug);
  const [activePhoto, setActivePhoto] = useState(0);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !place || !place.latitude || !place.longitude) return;

    const token = getMapboxToken();
    if (!token) return;

    mapboxgl.accessToken = token;
    const config = getMapConfig(token);

    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: config.style || 'mapbox://styles/mapbox/streets-v12',
        center: [place.longitude, place.latitude],
        zoom: 15,
      });
    }

    const handleMapLoad = () => {
      if (!map.current) return;

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '40px';
      el.style.height = '40px';
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

      markerRef.current = new mapboxgl.Marker(el)
        .setLngLat([place.longitude, place.latitude])
        .addTo(map.current);

      map.current.setCenter([place.longitude, place.latitude]);
      map.current.setZoom(15);
    };

    if (map.current.loaded()) {
      handleMapLoad();
    } else {
      map.current.once('load', handleMapLoad);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [place]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Place not found</h1>
            <Link to="/map" className="text-primary hover:underline">
              Back to Map
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const photos = place.imageUrl ? [place.imageUrl] : [getPlaceImageUrl(place.category, place.name, place.address)];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        {/* Back Button */ }
        <div className="container mx-auto px-4 py-4">
          <Link to="/map" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Map
          </Link>
        </div>

        {/* Hero Image */ }
        <div className="relative h-[40vh] min-h-[300px] bg-muted overflow-hidden">
          <motion.img
            key={ activePhoto }
            initial={ { opacity: 0 } }
            animate={ { opacity: 1 } }
            src={ photos[activePhoto] }
            alt={ place.name }
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/80 to-transparent" />

          {/* Photo Thumbnails */ }
          { photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              { photos.map((_, index) => (
                <button
                  key={ index }
                  onClick={ () => setActivePhoto(index) }
                  className={ cn(
                    "w-2 h-2 rounded-full transition-all",
                    activePhoto === index
                      ? "bg-cream w-6"
                      : "bg-cream/50 hover:bg-cream/70"
                  ) }
                />
              )) }
            </div>
          ) }

          {/* Category Badge */ }
          <span className="absolute top-3 left-3 px-3 py-1 bg-charcoal-dark/80 text-cream text-xs font-medium rounded-full backdrop-blur-sm">
            { place.category }
          </span>

          {/* Cuisine Badges at bottom of image */ }
          { place.cuisine && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
              { place.cuisine.split(';').map((badge, index) => (
                <span
                  key={ index }
                  className="px-2 py-1 bg-coral/90 text-white text-xs font-medium rounded-md backdrop-blur-sm shadow-sm"
                >
                  { badge.trim() }
                </span>
              )) }
            </div>
          ) }
        </div>

        {/* Content */ }
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={ { opacity: 0, y: 20 } }
              animate={ { opacity: 1, y: 0 } }
            >
              {/* Title & Meta */ }
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    { place.name }
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      { place.address }
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-display text-xl font-bold text-foreground">
                      { '🐖'.repeat(place.piggyPoints || 1) }
                    </div>
                    <span className="text-xs text-muted-foreground">Piggy Points</span>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <span className="font-display text-xl font-bold text-sage">
                      👍{ (() => {
                        const totalLikeDislike = (place.likesCount || 0) + (place.dislikeCount || 0);
                        if (totalLikeDislike > 0) {
                          const likesPercentage = Math.round(((place.likesCount || 0) / totalLikeDislike) * 100);
                          return `${likesPercentage}%`;
                        }
                        return '—';
                      })() }
                    </span>
                    <span className="text-xs text-muted-foreground block">Positive</span>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <span className="font-display text-xl font-bold text-coral">❤️{ place.favouritesCount || 0 }</span>
                    <span className="text-xs text-muted-foreground block">Favourites</span>
                  </div>
                </div>
              </div>

              {/* Map */ }
              { place.latitude && place.longitude && (
                <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
                  <div ref={ mapContainer } className="h-[300px] w-full" />
                </div>
              ) }
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}



