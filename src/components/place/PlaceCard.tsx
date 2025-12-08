import { Heart, Bookmark, ThumbsUp, ThumbsDown, MapPin, DollarSign, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useReactions } from "@/hooks/useReactions";

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
  reactions?: {
    favourites: boolean;
    wantToGo: boolean;
    like: boolean;
    dislike: boolean;
  };
  onReactionToggle?: (placeName: string, type: 'heart' | 'bookmark' | 'like' | 'dislike' | null) => void;
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
  reactions: reactionsProp,
  onReactionToggle,
}: PlaceCardProps) {
  // Use hook as fallback if reactions are not provided via props
  // Skip hook if reactions are provided via props to avoid unnecessary requests
  const useHookFallback = !reactionsProp && !onReactionToggle;
  const { reaction: hookReaction, toggleReaction: hookToggleReaction } = useReactions(name, !useHookFallback);

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
      onReactionToggle(name, type);
    }
  };

  // Determine current reaction from props or hook
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
            null);

  const priceLabel = "$".repeat(price);

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
        { imageUrl ? (
          <img
            src={ imageUrl }
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

        { cuisine && (
          <span className="inline-block px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-md mb-3">
            { cuisine }
          </span>
        ) }

        {/* Stats */ }
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-gold fill-gold" />
            <span className="font-medium">{ rating.toFixed(1) }</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-sage">{ sentiment }%</span>
            <span>positive</span>
          </div>
        </div>

        {/* Reactions */ }
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
            icon={ Bookmark }
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
        fill={ getFillColor() }
        strokeWidth={ active ? 2.5 : 2 }
      />
    </button>
  );
}
