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
        // Generate base slug from name
        const baseSlug = placeName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Try to find existing place by name (not slug, since slug might have duplicates)
        let { data: existingPlace, error: findError } = await supabase
            .from('places')
            .select('id, slug')
            .eq('name', placeName)
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

        // Generate unique slug by adding a hash suffix if needed
        let slug = baseSlug;
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            // Check if slug exists
            const { data: existingBySlug } = await supabase
                .from('places')
                .select('id')
                .eq('slug', slug)
                .maybeSingle();

            if (!existingBySlug) {
                // Slug is available, break and use it
                break;
            }

            // Slug exists, try to find by name instead
            const { data: existingByName } = await supabase
                .from('places')
                .select('id')
                .eq('name', placeName)
                .maybeSingle();

            if (existingByName) {
                // Place with same name exists, return its ID
                return existingByName.id;
            }

            // Generate unique slug with hash suffix
            const hash = Math.random().toString(36).substring(2, 8);
            slug = `${baseSlug}-${hash}`;
            attempts++;
        }

        // Try to insert place
        const { data: newPlace, error: createError } = await supabase
            .from('places')
            .insert({
                name: placeName,
                slug: slug,
            })
            .select('id')
            .single();

        if (createError) {
            // If creation fails due to duplicate slug, try to find by name
            if (createError.code === '23505') {
                const { data: retryPlace } = await supabase
                    .from('places')
                    .select('id')
                    .eq('name', placeName)
                    .maybeSingle();

                if (retryPlace) {
                    return retryPlace.id;
                }
            }

            // If creation fails for other reasons, try to find by name as fallback
            const { data: retryPlace } = await supabase
                .from('places')
                .select('id')
                .eq('name', placeName)
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
        // ВАЖНО: Места хранятся в Supabase в таблице places
        // Загружаем только те места, где пользователь ставил реакции

        // Получаем только те места, которые уже есть в Supabase (где пользователь ставил реакции)
        // Используем пагинацию, чтобы не перегружать запрос
        const BATCH_SIZE = 500; // Обрабатываем по 500 мест за раз
        const allPlaces: Array<{ id: string; slug: string; name: string }> = [];

        // Разбиваем на батчи для избежания слишком больших запросов
        for (let i = 0; i < placeNames.length; i += BATCH_SIZE) {
            const batch = placeNames.slice(i, i + BATCH_SIZE);
            const { data: places } = await supabase
                .from('places')
                .select('id, slug, name')
                .in('name', batch);

            if (places) {
                allPlaces.push(...places);
            }
        }

        // Создаем результат со всеми местами (по умолчанию без реакций)
        const result: Record<string, PlaceReactions> = {};
        placeNames.forEach(name => {
            result[name] = { favourites: false, wantToGo: false, like: false, dislike: false };
        });

        // Если есть места в Supabase, загружаем реакции для них
        if (allPlaces && allPlaces.length > 0) {
            const placeIds = allPlaces.map(p => p.id);
            const placeNameToId = new Map(allPlaces.map(p => [p.name, p.id]));

            // Get all reactions for these places
            const { data: reactions } = await supabase
                .from('user_reactions')
                .select('place_id, reaction_type')
                .eq('user_id', userId)
                .in('place_id', placeIds);

            // Обновляем реакции для мест, которые есть в Supabase
            if (reactions) {
                reactions.forEach(reaction => {
                    // Находим имя места по ID
                    const placeName = Array.from(placeNameToId.entries())
                        .find(([_, id]) => id === reaction.place_id)?.[0];

                    if (placeName && result[placeName]) {
                        if (reaction.reaction_type === 'love') {
                            result[placeName].favourites = true;
                        } else if (reaction.reaction_type === 'want_to_go') {
                            result[placeName].wantToGo = true;
                        } else if (reaction.reaction_type === 'like') {
                            result[placeName].like = true;
                        } else if (reaction.reaction_type === 'dislike') {
                            result[placeName].dislike = true;
                        }
                    }
                });
            }
        }

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

