import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Heart,
  Plus,
  Share2,
  MapPin,
  Star,
  Clock,
  Phone,
  Globe,
  ExternalLink,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Sample place data
const placeData = {
  name: "The Prospect of Whitby",
  slug: "prospect-of-whitby",
  address: "57 Wapping Wall, London E1W 3SH",
  category: "Pub",
  cuisine: "British",
  style: "Historic Pub",
  price: 2,
  rating: 4.5,
  sentiment: 89,
  description: "Dating back to 1520, The Prospect of Whitby is London's oldest riverside pub. With its pewter bar, flagstone floor, and stunning Thames views, it's a must-visit for anyone seeking an authentic British pub experience.",
  photos: [
    "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1574096079513-d8259312b785?w=800&h=500&fit=crop",
  ],
  hours: "Mon-Sun: 12:00 PM - 11:00 PM",
  phone: "+44 20 7481 1095",
  website: "https://www.greeneking-pubs.co.uk",
};

export default function PlacePage() {
  const { slug } = useParams();
  const [isFavourite, setIsFavourite] = useState(false);
  const [isWantToGo, setIsWantToGo] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  const priceLabel = "$".repeat(placeData.price);

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
            src={ placeData.photos[activePhoto] }
            alt={ placeData.name }
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-dark/80 to-transparent" />

          {/* Photo Thumbnails */ }
          { placeData.photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              { placeData.photos.map((_, index) => (
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
          <span className="absolute top-4 left-4 px-4 py-1.5 bg-charcoal-dark/80 text-cream text-sm font-medium rounded-full backdrop-blur-sm">
            { placeData.category }
          </span>

          {/* Action Buttons */ }
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant={ isFavourite ? "default" : "hero-outline" }
              size="icon"
              onClick={ () => setIsFavourite(!isFavourite) }
              className={ isFavourite ? "bg-coral hover:bg-coral-dark" : "" }
            >
              <Heart className={ cn("h-5 w-5", isFavourite && "fill-current") } />
            </Button>
            <Button
              variant={ isWantToGo ? "default" : "hero-outline" }
              size="icon"
              onClick={ () => setIsWantToGo(!isWantToGo) }
              className={ isWantToGo ? "bg-gold hover:bg-gold/80" : "" }
            >
              <Plus className={ cn("h-5 w-5", isWantToGo && "stroke-[3]") } />
            </Button>
            <Button variant="hero-outline" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
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
                    { placeData.name }
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      { placeData.address }
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gold">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="font-display text-xl font-bold">{ placeData.rating }</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Rating</span>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <span className="font-display text-xl font-bold text-sage">{ placeData.sentiment }%</span>
                    <span className="text-xs text-muted-foreground block">Positive</span>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <span className="font-display text-xl font-bold text-coral">{ priceLabel }</span>
                    <span className="text-xs text-muted-foreground block">Price</span>
                  </div>
                </div>
              </div>

              {/* Tags */ }
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                  { placeData.cuisine }
                </span>
                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">
                  { placeData.style }
                </span>
              </div>

              {/* Description */ }
              <div className="bg-card rounded-2xl border border-border p-6 mb-6">
                <h2 className="font-display text-lg font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">
                  { placeData.description }
                </p>
              </div>

              {/* Details */ }
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h2 className="font-display text-lg font-semibold mb-3">Details</h2>

                <div className="flex items-center gap-3 text-foreground">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{ placeData.hours }</span>
                </div>

                <div className="flex items-center gap-3 text-foreground">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <a href={ `tel:${placeData.phone}` } className="hover:text-primary">
                    { placeData.phone }
                  </a>
                </div>

                <div className="flex items-center gap-3 text-foreground">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <a href={ placeData.website } target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                    Visit Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button className="w-full" size="lg">
                    <MapPin className="h-4 w-4" />
                    Open in Maps
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
