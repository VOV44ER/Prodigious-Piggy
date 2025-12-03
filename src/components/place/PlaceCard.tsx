import { Heart, Bookmark, ThumbsUp, ThumbsDown, MapPin, DollarSign, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface PlaceCardProps {
  name: string;
  address: string;
  category: string;
  cuisine?: string;
  price: 1 | 2 | 3 | 4;
  rating: number;
  sentiment: number;
  imageUrl?: string;
  className?: string;
}

type ReactionType = "heart" | "bookmark" | "like" | "dislike" | null;

export function PlaceCard({
  name,
  address,
  category,
  cuisine,
  price,
  rating,
  sentiment,
  imageUrl,
  className,
}: PlaceCardProps) {
  const [reaction, setReaction] = useState<ReactionType>(null);

  const handleReaction = (type: ReactionType) => {
    setReaction(reaction === type ? null : type);
  };

  const priceLabel = "$".repeat(price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300",
        className
      )}
    >
      {/* Image */}
      <div className="relative h-40 bg-muted overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-coral opacity-30" />
        )}
        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-3 py-1 bg-charcoal-dark/80 text-cream text-xs font-medium rounded-full backdrop-blur-sm">
          {category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-lg text-foreground leading-tight line-clamp-1">
            {name}
          </h3>
          <span className="text-coral font-semibold text-sm whitespace-nowrap">
            {priceLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </div>

        {cuisine && (
          <span className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md mb-3">
            {cuisine}
          </span>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-gold fill-gold" />
            <span className="font-medium">{rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-sage">{sentiment}%</span>
            <span>positive</span>
          </div>
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-1 pt-3 border-t border-border">
          <ReactionButton
            icon={Heart}
            active={reaction === "heart"}
            onClick={() => handleReaction("heart")}
            label="Favourite"
            activeColor="text-coral fill-coral"
          />
          <ReactionButton
            icon={Bookmark}
            active={reaction === "bookmark"}
            onClick={() => handleReaction("bookmark")}
            label="Want to Go"
            activeColor="text-gold fill-gold"
          />
          <ReactionButton
            icon={ThumbsUp}
            active={reaction === "like"}
            onClick={() => handleReaction("like")}
            label="Like"
            activeColor="text-sage"
          />
          <ReactionButton
            icon={ThumbsDown}
            active={reaction === "dislike"}
            onClick={() => handleReaction("dislike")}
            label="Dislike"
            activeColor="text-muted-foreground"
          />
        </div>
      </div>
    </motion.div>
  );
}

interface ReactionButtonProps {
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  label: string;
  activeColor: string;
}

function ReactionButton({ icon: Icon, active, onClick, label, activeColor }: ReactionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
        active
          ? activeColor + " bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
