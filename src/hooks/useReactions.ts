import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ReactionType = 'love' | 'want_to_go' | 'like' | 'dislike' | null;

// Counter updates are now handled by database trigger
// No need to update counters manually in application code

export interface PlaceReactions {
    favourites: boolean;
    wantToGo: boolean;
    like: boolean;
    dislike: boolean;
}

export const useReactions = (placeName: string, placeId?: string, skip: boolean = false) => {
    const { user } = useAuth();
    const [reaction, setReaction] = useState<ReactionType>(null);
    const [loading, setLoading] = useState(true);
    const loadingRef = useRef(false);

    const loadReaction = useCallback(async () => {
        if (skip || !user || loadingRef.current) return;

        loadingRef.current = true;

        try {
            // ВАЖНО: Используем только placeId, если он передан
            // Если placeId не передан, не загружаем реакции, чтобы избежать проблем с дубликатами имен
            if (!placeId) {
                console.warn(`PlaceCard: placeId not provided for "${placeName}". Skipping reaction load to avoid duplicate name issues.`);
                setLoading(false);
                loadingRef.current = false;
                return;
            }

            // Load user reactions for this place
            const { data, error } = await supabase
                .from('user_reactions')
                .select('reaction_type')
                .eq('user_id', user.id)
                .eq('place_id', placeId);

            if (error) {
                console.error('Error loading reactions:', error);
                setLoading(false);
                loadingRef.current = false;
                return;
            }

            // Set the primary reaction (priority: love > want_to_go > like > dislike)
            if (data && data.length > 0) {
                const reactions = data.map(r => r.reaction_type);
                if (reactions.includes('love')) {
                    setReaction('love');
                } else if (reactions.includes('want_to_go')) {
                    setReaction('want_to_go');
                } else if (reactions.includes('like')) {
                    setReaction('like');
                } else if (reactions.includes('dislike')) {
                    setReaction('dislike');
                } else {
                    setReaction(null);
                }
            } else {
                setReaction(null);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error loading reaction:', error);
            setLoading(false);
        } finally {
            loadingRef.current = false;
        }
    }, [user, placeName, placeId, skip]);

    useEffect(() => {
        if (skip) {
            setLoading(false);
            return;
        }

        if (!user) {
            setReaction(null);
            setLoading(false);
            return;
        }

        loadReaction();
    }, [user, placeName, loadReaction, skip]);

    const toggleReaction = async (type: ReactionType) => {
        if (!user) {
            return;
        }

        try {
            if (!placeId) {
                console.warn(`PlaceCard: placeId not provided for "${placeName}". Cannot toggle reaction.`);
                return;
            }

            const newReaction = reaction === type ? null : type;

            if (newReaction === null) {
                // Remove reaction
                const { error } = await supabase
                    .from('user_reactions')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('place_id', placeId)
                    .eq('reaction_type', type);

                if (error) {
                    console.error('Error removing reaction:', error);
                    return;
                }
            } else {
                // Remove all existing reactions first (only one reaction per place)
                await supabase
                    .from('user_reactions')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('place_id', placeId);

                // Add new reaction
                const { error } = await supabase
                    .from('user_reactions')
                    .insert({
                        user_id: user.id,
                        place_id: placeId,
                        reaction_type: newReaction,
                    });

                if (error) {
                    console.error('Error saving reaction:', error);
                    return;
                }
            }

            setReaction(newReaction);
            // Don't reload - state is already updated
        } catch (error) {
            console.error('Error toggling reaction:', error);
            // Reload on error to sync state
            await loadReaction();
        }
    };

    return { reaction, loading, toggleReaction };
};

async function getPlaceIdByName(placeName: string): Promise<string | null> {
    try {
        // Only search for existing place by name - never create new places
        // WARNING: If multiple places have the same name, this will return the first one
        // This function should only be used as a fallback when placeId is not available
        const { data: existingPlaces, error: findError } = await supabase
            .from('places')
            .select('id')
            .eq('name', placeName)
            .limit(1);

        if (findError) {
            console.error('Error finding place:', findError);
            return null;
        }

        // If multiple places exist with the same name, we can't determine which one
        // Return null to avoid applying reaction to wrong place
        if (!existingPlaces || existingPlaces.length === 0) {
            return null;
        }

        // Only return ID if exactly one place found
        // If multiple places exist, return null to prevent incorrect reactions
        return existingPlaces[0]?.id || null;
    } catch (error) {
        console.error('Error getting place ID:', error);
        return null;
    }
}


export async function getUserReactionsForPlaces(
    userId: string,
    placeNames: string[],
    placeIds?: string[]
): Promise<{ byName: Record<string, PlaceReactions>; byId: Record<string, PlaceReactions> }> {
    try {
        const resultByName: Record<string, PlaceReactions> = {};
        const resultById: Record<string, PlaceReactions> = {};

        const nameCounts = new Map<string, number>();
        placeNames.forEach(name => {
            nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
        });

        // ВАЖНО: Если передан массив placeIds, используем его напрямую
        // Это гарантирует, что реакции применяются к правильным местам, даже если имена одинаковые
        if (placeIds && placeIds.length > 0 && placeIds.length === placeNames.length) {
            const placeIdToName = new Map<string, string>();
            placeNames.forEach((name, index) => {
                if (placeIds[index]) {
                    placeIdToName.set(placeIds[index], name);
                }
            });

            // Загружаем реакции по placeIds
            const BATCH_SIZE = 500;
            for (let i = 0; i < placeIds.length; i += BATCH_SIZE) {
                const batch = placeIds.slice(i, i + BATCH_SIZE);
                const { data: reactions } = await supabase
                    .from('user_reactions')
                    .select('place_id, reaction_type')
                    .eq('user_id', userId)
                    .in('place_id', batch);

                if (reactions) {
                    reactions.forEach(reaction => {
                        const placeName = placeIdToName.get(reaction.place_id);
                        const reactionData = {
                            favourites: reaction.reaction_type === 'love',
                            wantToGo: reaction.reaction_type === 'want_to_go',
                            like: reaction.reaction_type === 'like',
                            dislike: reaction.reaction_type === 'dislike',
                        };

                        // Обновляем по ID (приоритет)
                        if (reaction.place_id) {
                            resultById[reaction.place_id] = reactionData;
                        }

                        // Обновляем по имени только если это уникальное имя
                        if (placeName) {
                            // Проверяем, что это единственное место с таким именем
                            const placesWithSameName = placeIds?.filter((id, idx) => placeNames[idx] === placeName) || [];
                            if (placesWithSameName.length === 1) {
                                resultByName[placeName] = reactionData;
                            }
                        }
                    });
                }
            }

            return { byName: resultByName, byId: resultById };
        }

        // Если placeIds не передан, возвращаем пустые реакции
        // Это предотвращает проблемы с дубликатами имен
        return { byName: resultByName, byId: resultById };
    } catch (error) {
        console.error('Error loading user reactions:', error);
        const resultByName: Record<string, PlaceReactions> = {};
        const resultById: Record<string, PlaceReactions> = {};
        placeNames.forEach((name, index) => {
            const defaultReaction = { favourites: false, wantToGo: false, like: false, dislike: false };
            resultByName[name] = defaultReaction;
            if (placeIds && placeIds[index]) {
                resultById[placeIds[index]] = defaultReaction;
            }
        });
        return { byName: resultByName, byId: resultById };
    }
}

export async function toggleReactionForPlace(
    placeName: string,
    currentReactions: PlaceReactions,
    type: 'heart' | 'bookmark' | 'like' | 'dislike' | null,
    placeId?: string
): Promise<{ favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return currentReactions;
    }

    try {
        if (!placeId) {
            console.warn(`toggleReactionForPlace: placeId not provided for "${placeName}". Cannot toggle reaction.`);
            return currentReactions;
        }

        // Map UI reaction types to Supabase reaction types
        const supabaseType: ReactionType = type === 'heart' ? 'love' :
            type === 'bookmark' ? 'want_to_go' :
                type;

        // Check if we're toggling off the current reaction
        const isCurrentlyActive = (type === 'heart' && currentReactions.favourites) ||
            (type === 'bookmark' && currentReactions.wantToGo) ||
            (type === 'like' && currentReactions.like) ||
            (type === 'dislike' && currentReactions.dislike);

        if (isCurrentlyActive) {
            // Remove reaction
            const { error } = await supabase
                .from('user_reactions')
                .delete()
                .eq('user_id', user.id)
                .eq('place_id', placeId)
                .eq('reaction_type', supabaseType);

            if (error) {
                console.error('Error removing reaction:', error);
                return currentReactions;
            }

            // Counters are updated automatically by database trigger

            return {
                favourites: type === 'heart' ? false : currentReactions.favourites,
                wantToGo: type === 'bookmark' ? false : currentReactions.wantToGo,
                like: type === 'like' ? false : currentReactions.like,
                dislike: type === 'dislike' ? false : currentReactions.dislike,
            };
        } else {
            // Remove all existing reactions first (only one reaction per place)
            await supabase
                .from('user_reactions')
                .delete()
                .eq('user_id', user.id)
                .eq('place_id', placeId);

            // Add new reaction
            const { error } = await supabase
                .from('user_reactions')
                .insert({
                    user_id: user.id,
                    place_id: placeId,
                    reaction_type: supabaseType,
                });

            if (error) {
                console.error('Error saving reaction:', error);
                return currentReactions;
            }

            // Counters are updated automatically by database trigger

            return {
                favourites: type === 'heart',
                wantToGo: type === 'bookmark',
                like: type === 'like',
                dislike: type === 'dislike',
            };
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        return currentReactions;
    }
}

