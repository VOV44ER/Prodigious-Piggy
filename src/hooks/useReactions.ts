import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ReactionType = 'love' | 'want_to_go' | 'like' | 'dislike' | null;

export interface PlaceReactions {
    favourites: boolean;
    wantToGo: boolean;
    like: boolean;
    dislike: boolean;
}

export const useReactions = (placeName: string, skip: boolean = false) => {
    const { user } = useAuth();
    const [reaction, setReaction] = useState<ReactionType>(null);
    const [loading, setLoading] = useState(true);
    const loadingRef = useRef(false);

    const loadReaction = useCallback(async () => {
        if (skip || !user || loadingRef.current) return;

        loadingRef.current = true;

        try {
            // First, find or create place by name
            const placeId = await getOrCreatePlaceId(placeName);
            if (!placeId) {
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
    }, [user, placeName, skip]);

    useEffect(() => {
        if (skip) {
            setLoading(false);
            return;
        }

        if (!user) {
            // Fallback to localStorage if not authenticated
            try {
                const reactions = localStorage.getItem('place_reactions');
                if (reactions) {
                    const parsed = JSON.parse(reactions);
                    const placeReactions = parsed[placeName] || {};
                    if (placeReactions.heart || placeReactions.love) {
                        setReaction('love');
                    } else if (placeReactions.bookmark || placeReactions.want_to_go) {
                        setReaction('want_to_go');
                    } else if (placeReactions.like) {
                        setReaction('like');
                    } else if (placeReactions.dislike) {
                        setReaction('dislike');
                    } else {
                        setReaction(null);
                    }
                } else {
                    setReaction(null);
                }
            } catch {
                // Ignore errors
            }
            setLoading(false);
            return;
        }

        loadReaction();
    }, [user, placeName, loadReaction, skip]);

    const toggleReaction = async (type: ReactionType) => {
        if (!user) {
            // Fallback to localStorage if not authenticated
            const newReaction = reaction === type ? null : type;
            setReaction(newReaction);
            saveToLocalStorage(placeName, newReaction);
            // Dispatch custom event to notify other components
            window.dispatchEvent(new Event('place_reactions_updated'));
            return;
        }

        try {
            const placeId = await getOrCreatePlaceId(placeName);
            if (!placeId) return;

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

async function getOrCreatePlaceId(placeName: string): Promise<string | null> {
    try {
        // Generate slug from name
        const slug = placeName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Try to find existing place by slug
        let { data: existingPlace, error: findError } = await supabase
            .from('places')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (existingPlace && !findError) {
            return existingPlace.id;
        }

        // If not found and user is authenticated, try to create a new place
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // If not authenticated, return null - we'll use localStorage fallback
            return null;
        }

        // Try to create a new place
        const { data: newPlace, error: createError } = await supabase
            .from('places')
            .insert({
                name: placeName,
                slug: slug,
            })
            .select('id')
            .single();

        if (createError) {
            // If creation fails (e.g., due to RLS), try to find again (might have been created by another user)
            const { data: retryPlace } = await supabase
                .from('places')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            if (retryPlace) {
                return retryPlace.id;
            }

            console.error('Error creating place:', createError);
            return null;
        }

        return newPlace?.id || null;
    } catch (error) {
        console.error('Error getting place ID:', error);
        return null;
    }
}

function saveToLocalStorage(placeName: string, reaction: ReactionType) {
    try {
        const reactions = localStorage.getItem('place_reactions') || '{}';
        const parsed = JSON.parse(reactions);

        if (!parsed[placeName]) {
            parsed[placeName] = {};
        }

        delete parsed[placeName].heart;
        delete parsed[placeName].love;
        delete parsed[placeName].bookmark;
        delete parsed[placeName].want_to_go;
        delete parsed[placeName].like;
        delete parsed[placeName].dislike;

        if (reaction === 'love') {
            parsed[placeName].love = true;
        } else if (reaction === 'want_to_go') {
            parsed[placeName].want_to_go = true;
        } else if (reaction === 'like') {
            parsed[placeName].like = true;
        } else if (reaction === 'dislike') {
            parsed[placeName].dislike = true;
        }

        localStorage.setItem('place_reactions', JSON.stringify(parsed));
    } catch {
        // Ignore errors
    }
}

export async function getUserReactionsForPlaces(
    userId: string,
    placeNames: string[]
): Promise<Record<string, PlaceReactions>> {
    try {
        // Get place IDs for all place names
        const slugs = placeNames.map(name =>
            name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
        );

        const { data: places } = await supabase
            .from('places')
            .select('id, slug, name')
            .in('slug', slugs);

        // Create missing places in batch if needed
        const existingSlugs = new Set(places?.map(p => p.slug) || []);
        const missingPlaces = placeNames
            .map(name => {
                const slug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                return { name, slug };
            })
            .filter(({ slug }) => !existingSlugs.has(slug));

        if (missingPlaces.length > 0) {
            // Try to create missing places in batch
            // Note: This might fail due to RLS, but we'll continue anyway
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('places')
                        .insert(missingPlaces.map(({ name, slug }) => ({ name, slug })))
                        .select('id, slug, name');
                }
            } catch (error) {
                // Ignore errors - places might be created by other users or RLS might block
                console.log('Could not create missing places in batch:', error);
            }

            // Re-fetch places after potential creation
            const { data: updatedPlaces } = await supabase
                .from('places')
                .select('id, slug, name')
                .in('slug', slugs);

            if (updatedPlaces) {
                places?.push(...updatedPlaces.filter(p => !existingSlugs.has(p.slug)));
            }
        }

        if (!places || places.length === 0) {
            // Return empty reactions for all places
            const result: Record<string, PlaceReactions> = {};
            placeNames.forEach(name => {
                result[name] = { favourites: false, wantToGo: false, like: false, dislike: false };
            });
            return result;
        }

        const placeIds = places.map(p => p.id);

        // Get all reactions for these places
        const { data: reactions } = await supabase
            .from('user_reactions')
            .select('place_id, reaction_type')
            .eq('user_id', userId)
            .in('place_id', placeIds);

        // Build result map
        const result: Record<string, PlaceReactions> = {};

        placeNames.forEach(placeName => {
            const slug = placeName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            const place = places.find(p => p.slug === slug);
            if (!place) {
                result[placeName] = { favourites: false, wantToGo: false, like: false, dislike: false };
                return;
            }

            const placeReactions = reactions?.filter(r => r.place_id === place.id) || [];
            result[placeName] = {
                favourites: placeReactions.some(r => r.reaction_type === 'love'),
                wantToGo: placeReactions.some(r => r.reaction_type === 'want_to_go'),
                like: placeReactions.some(r => r.reaction_type === 'like'),
                dislike: placeReactions.some(r => r.reaction_type === 'dislike'),
            };
        });

        return result;
    } catch (error) {
        console.error('Error loading user reactions:', error);
        // Return empty reactions for all places on error
        const result: Record<string, PlaceReactions> = {};
        placeNames.forEach(name => {
            result[name] = { favourites: false, wantToGo: false, like: false, dislike: false };
        });
        return result;
    }
}

export async function toggleReactionForPlace(
    placeName: string,
    currentReactions: PlaceReactions,
    type: 'heart' | 'bookmark' | 'like' | 'dislike' | null
): Promise<{ favourites: boolean; wantToGo: boolean; like: boolean; dislike: boolean }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Fallback to localStorage if not authenticated
        const supabaseType = type === 'heart' ? 'love' : type === 'bookmark' ? 'want_to_go' : type;
        const newReaction = (type === 'heart' && currentReactions.favourites) ||
            (type === 'bookmark' && currentReactions.wantToGo) ||
            (type === 'like' && currentReactions.like) ||
            (type === 'dislike' && currentReactions.dislike) ? null : supabaseType;

        saveToLocalStorage(placeName, newReaction);
        window.dispatchEvent(new Event('place_reactions_updated'));

        return {
            favourites: newReaction === 'love',
            wantToGo: newReaction === 'want_to_go',
            like: newReaction === 'like',
            dislike: newReaction === 'dislike',
        };
    }

    try {
        const placeId = await getOrCreatePlaceId(placeName);
        if (!placeId) {
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

