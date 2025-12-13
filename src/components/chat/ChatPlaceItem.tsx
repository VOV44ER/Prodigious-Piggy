import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toggleReactionForPlace } from "@/hooks/useReactions";
import { useAuth } from "@/hooks/useAuth";

interface ChatPlaceItemProps {
    placeId?: string;
    name: string;
    address: string;
    price: 1 | 2 | 3 | 4;
    sentiment: number;
    likesCount: number;
    dislikeCount: number;
    favouritesCount: number;
    userReactions?: {
        favourites: boolean;
        wantToGo: boolean;
        like: boolean;
        dislike: boolean;
    };
    onReactionUpdate?: () => void;
}

const getPriceSymbols = (price: 1 | 2 | 3 | 4): string => {
    return "$".repeat(price);
};

export function ChatPlaceItem({
    placeId,
    name,
    address,
    price,
    sentiment,
    likesCount,
    dislikeCount,
    favouritesCount,
    userReactions,
    onReactionUpdate,
}: ChatPlaceItemProps) {
    const { user } = useAuth();
    const priceSymbols = getPriceSymbols(price);
    const likesPercentage = sentiment;

    const handleReaction = async (type: 'heart' | 'bookmark' | 'like' | 'dislike' | null) => {
        if (!user || !placeId) return;

        const currentReactions = userReactions || {
            favourites: false,
            wantToGo: false,
            like: false,
            dislike: false,
        };

        await toggleReactionForPlace(name, currentReactions, type, placeId);
        if (onReactionUpdate) {
            onReactionUpdate();
        }
    };

    const isFavourite = userReactions?.favourites || false;
    const isWantToGo = userReactions?.wantToGo || false;
    const isLiked = userReactions?.like || false;
    const isDisliked = userReactions?.dislike || false;

    return (
        <div className="my-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground">{ name }</span>
                <span className="text-muted-foreground">{ priceSymbols }</span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={ cn(
                            "h-7 w-7 p-0 rounded-md transition-all",
                            isFavourite
                                ? "bg-coral/20 text-coral hover:bg-coral/30 border border-coral/30"
                                : "hover:bg-accent"
                        ) }
                        onClick={ () => handleReaction('heart') }
                    >
                        <span className="text-base">❤️</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={ cn(
                            "h-7 w-7 p-0 rounded-md transition-all",
                            isWantToGo
                                ? "bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
                                : "hover:bg-accent"
                        ) }
                        onClick={ () => handleReaction('bookmark') }
                    >
                        <span className="text-base">➕</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={ cn(
                            "h-7 w-7 p-0 rounded-md transition-all",
                            isLiked
                                ? "bg-green-500/20 text-green-600 hover:bg-green-500/30 border border-green-500/30"
                                : "hover:bg-accent"
                        ) }
                        onClick={ () => handleReaction('like') }
                    >
                        <span className="text-base">👍</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={ cn(
                            "h-7 w-7 p-0 rounded-md transition-all",
                            isDisliked
                                ? "bg-red-500/20 text-red-600 hover:bg-red-500/30 border border-red-500/30"
                                : "hover:bg-accent"
                        ) }
                        onClick={ () => handleReaction('dislike') }
                    >
                        <span className="text-base">👎</span>
                    </Button>
                </div>
            </div>
            <div className="text-sm text-muted-foreground mb-1">{ address }</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>🐖</span>
                <span>|</span>
                <span>👍{ likesPercentage }%</span>
                <span>|</span>
                <span>❤️{ favouritesCount }x</span>
            </div>
        </div>
    );
}

