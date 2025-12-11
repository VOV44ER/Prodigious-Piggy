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

    useEffect(() => {
        loadCuisineReactions();

        const handleUpdate = () => {
            loadCuisineReactions();
        };

        window.addEventListener('cuisine_reactions_updated', handleUpdate);

        if (user) {
            const channel = supabase
                .channel('cuisine_reactions_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'cuisine_reactions',
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

