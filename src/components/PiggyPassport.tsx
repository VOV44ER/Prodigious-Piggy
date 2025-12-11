import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, ThumbsUp, ThumbsDown, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { casablancaPlaces } from "@/data/casablanca-places";
import { getUserReactionsForPlaces } from "@/hooks/useReactions";

export type CuisineReaction = 'like' | 'dislike' | null;

interface CuisineReactions {
    [cuisine: string]: CuisineReaction;
}

const ALL_CUISINES = [
    "Moroccan",
    "Mediterranean",
    "International",
    "French",
    "African",
    "Coffee",
    "Japanese",
    "Italian",
    "British",
    "Indian",
    "Mexican",
    "Chinese",
    "Thai",
    "Asian Fusion",
    "Greek",
    "Modern American",
];

export function PiggyPassport() {
    const { user } = useAuth();
    const [cuisineReactions, setCuisineReactions] = useState<CuisineReactions>({});
    const [loading, setLoading] = useState(true);
    const [experiencedCuisines, setExperiencedCuisines] = useState<Set<string>>(new Set());

    const loadCuisineReactions = useCallback(async () => {
        if (!user) {
            try {
                const stored = localStorage.getItem('cuisine_reactions');
                if (stored) {
                    setCuisineReactions(JSON.parse(stored));
                }
            } catch {
            }
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('cuisine_reactions')
                .select('cuisine, reaction_type')
                .eq('user_id', user.id);

            if (error) throw error;

            const reactions: CuisineReactions = {};
            if (data) {
                data.forEach((row: any) => {
                    reactions[row.cuisine] = row.reaction_type;
                });
            }
            setCuisineReactions(reactions);
        } catch (error) {
            console.error('Error loading cuisine reactions:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const loadExperiencedCuisines = useCallback(async () => {
        if (!user) {
            try {
                const reactions = localStorage.getItem('place_reactions');
                if (reactions) {
                    const parsed = JSON.parse(reactions);
                    const experienced = new Set<string>();
                    casablancaPlaces.forEach(place => {
                        if (place.cuisine) {
                            const placeReactions = parsed[place.name] || {};
                            if (placeReactions.heart || placeReactions.love || placeReactions.been_there) {
                                experienced.add(place.cuisine);
                            }
                        }
                    });
                    setExperiencedCuisines(experienced);
                } else {
                    setExperiencedCuisines(new Set());
                }
            } catch {
                setExperiencedCuisines(new Set());
            }
            return;
        }

        try {
            const placeNames = casablancaPlaces.map(p => p.name);
            const reactions = await getUserReactionsForPlaces(user.id, placeNames);

            const experienced = new Set<string>();
            casablancaPlaces.forEach(place => {
                if (place.cuisine) {
                    const placeReactions = reactions[place.name] || { favourites: false, wantToGo: false, like: false, dislike: false };
                    if (placeReactions.favourites) {
                        experienced.add(place.cuisine);
                    }
                }
            });
            setExperiencedCuisines(experienced);
        } catch (error) {
            console.error('Error loading experienced cuisines:', error);
            setExperiencedCuisines(new Set());
        }
    }, [user]);

    useEffect(() => {
        loadCuisineReactions();
        loadExperiencedCuisines();

        const handleUpdate = () => {
            loadCuisineReactions();
            loadExperiencedCuisines();
        };

        window.addEventListener('place_reactions_updated', handleUpdate);
        window.addEventListener('cuisine_reactions_updated', handleUpdate);

        return () => {
            window.removeEventListener('place_reactions_updated', handleUpdate);
            window.removeEventListener('cuisine_reactions_updated', handleUpdate);
        };
    }, [loadCuisineReactions, loadExperiencedCuisines]);

    const toggleCuisineReaction = useCallback(async (cuisine: string, reaction: CuisineReaction) => {
        const currentReaction = cuisineReactions[cuisine];
        const newReaction = currentReaction === reaction ? null : reaction;

        const updated = { ...cuisineReactions, [cuisine]: newReaction };
        setCuisineReactions(updated);

        if (!user) {
            localStorage.setItem('cuisine_reactions', JSON.stringify(updated));
            window.dispatchEvent(new Event('cuisine_reactions_updated'));
            return;
        }

        try {
            if (newReaction === null) {
                await supabase
                    .from('cuisine_reactions')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('cuisine', cuisine);
            } else {
                await supabase
                    .from('cuisine_reactions')
                    .upsert({
                        user_id: user.id,
                        cuisine,
                        reaction_type: newReaction,
                    }, {
                        onConflict: 'user_id,cuisine'
                    });
            }
            window.dispatchEvent(new Event('cuisine_reactions_updated'));
        } catch (error) {
            console.error('Error saving cuisine reaction:', error);
            setCuisineReactions(cuisineReactions);
        }
    }, [user, cuisineReactions]);

    const experiencedCount = ALL_CUISINES.filter(c => experiencedCuisines.has(c)).length;

    if (loading) {
        return (
            <div className="bg-card rounded-2xl border border-border p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="grid grid-cols-2 gap-3">
                        { [1, 2, 3, 4].map(i => (
                            <div key={ i } className="h-12 bg-muted rounded-lg"></div>
                        )) }
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-coral" />
                </div>
                <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                        Your Piggy Passport
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        This is your passport! It chronicles <strong>every cuisine</strong> listed in the Piggy database. As you visit places, you'll see each cuisine marked as experienced.
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="font-display text-lg font-semibold text-coral mb-4">
                    Cuisines ({ experiencedCount }/{ ALL_CUISINES.length })
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    { ALL_CUISINES.map((cuisine) => {
                        const isExperienced = experiencedCuisines.has(cuisine);
                        const reaction = cuisineReactions[cuisine] || null;
                        const isLiked = reaction === 'like';
                        const isDisliked = reaction === 'dislike';

                        return (
                            <motion.button
                                key={ cuisine }
                                onClick={ (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                } }
                                className={ cn(
                                    "relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                                    isExperienced
                                        ? "bg-amber-50/50 border-amber-200/50"
                                        : "bg-background border-border hover:border-primary/30"
                                ) }
                                whileHover={ { scale: 1.02 } }
                                whileTap={ { scale: 0.98 } }
                            >
                                <div className="flex-shrink-0">
                                    { isExperienced ? (
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        </div>
                                    ) : (
                                        <Circle className="h-6 w-6 text-muted-foreground/40" />
                                    ) }
                                </div>
                                <span className={ cn(
                                    "flex-1 font-medium",
                                    isExperienced ? "text-foreground" : "text-muted-foreground"
                                ) }>
                                    { cuisine }
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={ (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleCuisineReaction(cuisine, 'like');
                                        } }
                                        className={ cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            isLiked
                                                ? "bg-green-100 text-green-600"
                                                : "text-muted-foreground hover:text-green-600 hover:bg-green-50"
                                        ) }
                                    >
                                        <ThumbsUp className={ cn("h-4 w-4", isLiked && "fill-current") } />
                                    </button>
                                    <button
                                        onClick={ (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleCuisineReaction(cuisine, 'dislike');
                                        } }
                                        className={ cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            isDisliked
                                                ? "bg-red-100 text-red-600"
                                                : "text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                        ) }
                                    >
                                        <ThumbsDown className={ cn("h-4 w-4", isDisliked && "fill-current") } />
                                    </button>
                                </div>
                            </motion.button>
                        );
                    }) }
                </div>
            </div>
        </div>
    );
}

