import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type CuisineReaction = 'like' | 'dislike' | null;

export interface CuisineReactions {
    [cuisine: string]: CuisineReaction;
}

export function useCuisineReactions() {
    const { user } = useAuth();
    const [cuisineReactions, setCuisineReactions] = useState<CuisineReactions>({});
    const [loading, setLoading] = useState(true);

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
            // Загружаем реакции из user_reactions и извлекаем кухни из мест
            const { data: userReactions } = await supabase
                .from('user_reactions')
                .select('place_id, reaction_type')
                .eq('user_id', user.id)
                .in('reaction_type', ['like', 'dislike']);

            if (userReactions && userReactions.length > 0) {
                const placeIds = [...new Set(userReactions.map(r => r.place_id))];
                const { data: places } = await supabase
                    .from('places')
                    .select('id, cuisine')
                    .in('id', placeIds);

                const reactions: CuisineReactions = {};

                // Группируем реакции по кухне
                userReactions.forEach(reaction => {
                    const place = places?.find(p => p.id === reaction.place_id);
                    if (place && place.cuisine) {
                        // Если уже есть реакция для этой кухни, приоритет у 'dislike'
                        if (!reactions[place.cuisine] || reaction.reaction_type === 'dislike') {
                            reactions[place.cuisine] = reaction.reaction_type as 'like' | 'dislike';
                        }
                    }
                });

                setCuisineReactions(reactions);
            } else {
                setCuisineReactions({});
            }
        } catch (error) {
            console.error('Error loading cuisine reactions:', error);
            setCuisineReactions({});
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadCuisineReactions();

        const handleUpdate = () => {
            loadCuisineReactions();
        };

        window.addEventListener('cuisine_reactions_updated', handleUpdate);

        if (user) {
            // Подписываемся на изменения в user_reactions вместо cuisine_reactions
            const channel = supabase
                .channel('user_reactions_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'user_reactions',
                        filter: `user_id=eq.${user.id}`,
                    },
                    () => {
                        loadCuisineReactions();
                    }
                )
                .subscribe();

            return () => {
                window.removeEventListener('cuisine_reactions_updated', handleUpdate);
                supabase.removeChannel(channel);
            };
        }

        return () => {
            window.removeEventListener('cuisine_reactions_updated', handleUpdate);
        };
    }, [user, loadCuisineReactions]);

    return { cuisineReactions, loading };
}

