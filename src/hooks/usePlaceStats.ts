import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlaceStats {
    likesCount: number;
    favouritesCount: number;
    likesPercentage: number;
}

export function usePlaceStats(placeId: string | undefined) {
    const [stats, setStats] = useState<PlaceStats>({ likesCount: 0, favouritesCount: 0, likesPercentage: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!placeId) {
            setLoading(false);
            return;
        }

        const loadStats = async () => {
            try {
                const { data: reactions, error } = await supabase
                    .from('user_reactions')
                    .select('reaction_type')
                    .eq('place_id', placeId);

                if (error) {
                    console.error('Error loading place stats:', error);
                    setLoading(false);
                    return;
                }

                if (reactions) {
                    const likesCount = reactions.filter(r => r.reaction_type === 'like').length;
                    const favouritesCount = reactions.filter(r => r.reaction_type === 'love').length;
                    const totalReactions = reactions.length;

                    const likesPercentage = totalReactions > 0
                        ? Math.round((likesCount / totalReactions) * 100)
                        : 0;

                    setStats({
                        likesCount,
                        favouritesCount,
                        likesPercentage,
                    });
                } else {
                    setStats({
                        likesCount: 0,
                        favouritesCount: 0,
                        likesPercentage: 0,
                    });
                }
            } catch (error) {
                console.error('Error loading place stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();

        const channel = supabase
            .channel(`place_stats_${placeId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_reactions',
                    filter: `place_id=eq.${placeId}`,
                },
                () => {
                    loadStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [placeId]);

    return { stats, loading };
}

