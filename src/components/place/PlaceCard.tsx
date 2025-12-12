import { Heart, Plus, ThumbsUp, ThumbsDown, MapPin, DollarSign, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReactions } from "@/hooks/useReactions";
import { getPlaceImageUrl } from "@/lib/place-images";
import { usePlaceStats } from "@/hooks/usePlaceStats";

interface PlaceCardProps {
  id?: string;
  name: string;
  address: string;
  category: string;
  cuisine?: string;
  price: 1 | 2 | 3 | 4;
  rating: number;
  sentiment: number;
  imageUrl?: string;
  className?: string;
  reactions?: {
    favourites: boolean;
    wantToGo: boolean;
    like: boolean;
    dislike: boolean;
  };
  onReactionToggle?: (placeName: string, type: 'heart' | 'bookmark' | 'like' | 'dislike' | null, placeId?: string) => void;
  hideActions?: boolean;
}

type ReactionType = "heart" | "bookmark" | "like" | "dislike" | null;

export function PlaceCard({
  id,
  name,
  address,
  category,
  cuisine,
  price,
  rating,
  sentiment,
  imageUrl,
  className,
  reactions: reactionsProp,
  onReactionToggle,
  hideActions = false,
}: PlaceCardProps) {
  // Use hook as fallback if reactions are not provided via props
  // Also use hook if onReactionToggle is provided but reactionsProp might be incomplete
  // This ensures we always have the latest reaction state
  const useHookFallback = !reactionsProp && !onReactionToggle;
  const { reaction: hookReaction, toggleReaction: hookToggleReaction } = useReactions(name, id, useHookFallback);
  const { stats: placeStats } = usePlaceStats(id);

  const handleReaction = async (type: ReactionType) => {
    if (useHookFallback) {
      // Map UI reaction types to Supabase reaction types
      let supabaseType: 'love' | 'want_to_go' | 'like' | 'dislike' | null = null;

      if (type === 'heart') {
        supabaseType = 'love';
      } else if (type === 'bookmark') {
        supabaseType = 'want_to_go';
      } else if (type === 'like') {
        supabaseType = 'like';
      } else if (type === 'dislike') {
        supabaseType = 'dislike';
      }

      await hookToggleReaction(supabaseType);
    } else if (onReactionToggle) {
      onReactionToggle(name, type, id);
    }
  };

  // Determine current reaction from props or hook
  // Priority: reactionsProp (if complete) > hookReaction
  const uiReaction: ReactionType = useHookFallback
    ? (hookReaction === 'love' ? 'heart' :
      hookReaction === 'want_to_go' ? 'bookmark' :
        hookReaction === 'like' ? 'like' :
          hookReaction === 'dislike' ? 'dislike' :
            null)
    : (reactionsProp?.favourites ? 'heart' :
      reactionsProp?.wantToGo ? 'bookmark' :
        reactionsProp?.like ? 'like' :
          reactionsProp?.dislike ? 'dislike' :
            // Fallback to hook if reactionsProp doesn't have the reaction
            (hookReaction === 'love' ? 'heart' :
              hookReaction === 'want_to_go' ? 'bookmark' :
                hookReaction === 'like' ? 'like' :
                  hookReaction === 'dislike' ? 'dislike' :
                    null));

  const priceLabel = "$".repeat(price);

  const cuisineBadges = cuisine
    ? cuisine.split(';').map(c => c.trim()).filter(c => c.length > 0)
    : [];

  const displayImageUrl = imageUrl || getPlaceImageUrl(category, name, address);

  return (
    <motion.div
      initial={ { opacity: 0, y: 20 } }
      animate={ { opacity: 1, y: 0 } }
      whileHover={ { y: -4 } }
      className={ cn(
        "group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300",
        className
      ) }
    >
      {/* Image */ }
      <div className="relative h-40 bg-muted overflow-hidden">
        { displayImageUrl ? (
          <img
            src={ displayImageUrl }
            alt={ name }
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-coral opacity-30" />
        ) }
        {/* Category Badge */ }
        <span className="absolute top-3 left-3 px-3 py-1 bg-charcoal-dark/80 text-cream text-xs font-medium rounded-full backdrop-blur-sm">
          { category }
        </span>
        {/* Cuisine Badges at bottom of image */ }
        { cuisineBadges.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
            { cuisineBadges.map((badge, index) => (
              <span
                key={ index }
                className="px-2 py-1 bg-coral/90 text-white text-xs font-medium rounded-md backdrop-blur-sm shadow-sm"
              >
                { badge }
              </span>
            )) }
          </div>
        ) }
      </div>

      {/* Content */ }
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-lg text-foreground leading-tight line-clamp-1">
            { name }
          </h3>
          <span className="text-coral font-semibold text-sm whitespace-nowrap">
            { priceLabel }
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{ address }</span>
        </div>

        {/* Stats */ }
        <div className="flex items-center gap-2 text-sm mb-4 text-muted-foreground">
          <span>🐖</span>
          <span>|</span>
          <span className="text-sage">👍{ placeStats.likesPercentage }%</span>
          <span>|</span>
          <span className="text-coral">❤️{ placeStats.favouritesCount }x</span>
        </div>

        {/* Reactions */ }
        { !hideActions && (
          <div className="flex items-center gap-1 pt-3 border-t border-border">
            <ReactionButton
              icon={ Heart }
              active={ uiReaction === "heart" }
              onClick={ () => handleReaction("heart") }
              label="Favourite"
              activeColor="text-coral"
              fillColor="coral"
            />
            <ReactionButton
              icon={ Plus }
              active={ uiReaction === "bookmark" }
              onClick={ () => handleReaction("bookmark") }
              label="Want to Go"
              activeColor="text-gold"
              fillColor="gold"
            />
            <ReactionButton
              icon={ ThumbsUp }
              active={ uiReaction === "like" }
              onClick={ () => handleReaction("like") }
              label="Like"
              activeColor="text-sage"
              fillColor="sage"
            />
            <ReactionButton
              icon={ ThumbsDown }
              active={ uiReaction === "dislike" }
              onClick={ () => handleReaction("dislike") }
              label="Dislike"
              activeColor="text-muted-foreground"
              fillColor="muted-foreground"
            />
          </div>
        ) }
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
  fillColor?: string;
}

function ReactionButton({ icon: Icon, active, onClick, label, activeColor, fillColor }: ReactionButtonProps) {
  // Get fill color from CSS variable if fillColor is provided
  const getFillColor = () => {
    if (!active || !fillColor) return "none";

    // Map fillColor names to CSS variable names
    const colorMap: Record<string, string> = {
      coral: "hsl(var(--coral))",
      gold: "hsl(var(--gold))",
      sage: "hsl(var(--sage))",
      "muted-foreground": "hsl(var(--muted-foreground))",
    };

    return colorMap[fillColor] || "currentColor";
  };

  const isPlusIcon = label === "Want to Go";

  return (
    <button
      onClick={ onClick }
      className={ cn(
        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
        active
          ? activeColor
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      ) }
      title={ label }
    >
      <Icon
        className="h-4 w-4"
        fill={ isPlusIcon ? "none" : getFillColor() }
        strokeWidth={ active && isPlusIcon ? 3 : active ? 2.5 : 2 }
      />
    </button>
  );
}
