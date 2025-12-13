import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Place } from './usePlaces';
import type { Database } from '@/integrations/supabase/types';

type PlaceRow = Database['public']['Tables']['places']['Row'];

function convertPlaceRowToPlace(row: PlaceRow): Place {
    const categoryMap: Record<string, string> = {
        'restaurant': 'Restaurant',
        'cafe': 'Cafe',
        'bar': 'Bar',
        'bakery': 'Bakery',
        'food_truck': 'Food Truck',
        'market': 'Market',
    };

    const category = row.category ? categoryMap[row.category] || 'Restaurant' : 'Restaurant';

    const cuisine = row.cuisine_type && row.cuisine_type.length > 0
        ? row.cuisine_type[0]
        : undefined;

    const price = (row.price_level as 1 | 2 | 3 | 4) || 2;
    const rating = row.rating || 4.0;
    const sentiment = row.sentiment_score ? Math.round(row.sentiment_score * 100) : 70;
    const imageUrl = row.photos && row.photos.length > 0 ? row.photos[0] : undefined;

    const ratingValue = row.rating;
    const normalizedPiggyPoints = ratingValue && ratingValue >= 1 && ratingValue <= 3
        ? (ratingValue as 1 | 2 | 3)
        : undefined;

    return {
        id: row.id,
        name: row.name,
        address: row.address || '',
        city: row.city,
        country: row.country,
        category,
        cuisine,
        price,
        rating,
        sentiment,
        imageUrl,
        latitude: row.latitude || 0,
        longitude: row.longitude || 0,
        likesCount: (row as any).likes_count || 0,
        favouritesCount: (row as any).favourites_count || 0,
        wantToGoCount: (row as any).want_to_go_count || 0,
        dislikeCount: (row as any).dislike_count || 0,
        piggyPoints: normalizedPiggyPoints,
        slug: row.slug,
    };
}

export function usePlace(slug: string | undefined) {
    const [place, setPlace] = useState<Place | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) {
            setPlace(null);
            setLoading(false);
            return;
        }

        const loadPlace = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data, error: fetchError } = await supabase
                    .from('places')
                    .select('*, likes_count, favourites_count, want_to_go_count, dislike_count')
                    .eq('slug', slug)
                    .single();

                if (fetchError) {
                    throw fetchError;
                }

                if (data) {
                    setPlace(convertPlaceRowToPlace(data));
                } else {
                    setPlace(null);
                }
            } catch (err) {
                console.error('Error loading place:', err);
                setError(err instanceof Error ? err.message : 'Failed to load place');
                setPlace(null);
            } finally {
                setLoading(false);
            }
        };

        loadPlace();
    }, [slug]);

    return { place, loading, error };
}

