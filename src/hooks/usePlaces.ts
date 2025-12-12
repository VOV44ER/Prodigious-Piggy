import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PlaceRow = Database['public']['Tables']['places']['Row'];

export interface Place {
    id: string;
    name: string;
    address: string;
    city?: string | null;
    country?: string | null;
    category: string;
    cuisine?: string | null;
    price: 1 | 2 | 3 | 4;
    rating: number;
    sentiment: number;
    imageUrl?: string;
    latitude: number;
    longitude: number;
}

function normalizeCityName(cityName: string): string {
    return cityName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/kiev/g, 'kyiv')
        .replace(/moscow/g, 'moskva');
}

function convertPlaceRowToPlace(row: PlaceRow): Place {
    // Преобразуем category из enum в строку
    const categoryMap: Record<string, string> = {
        'restaurant': 'Restaurant',
        'cafe': 'Cafe',
        'bar': 'Bar',
        'bakery': 'Bakery',
        'food_truck': 'Food Truck',
        'market': 'Market',
    };

    const category = row.category ? categoryMap[row.category] || 'Restaurant' : 'Restaurant';

    // Преобразуем cuisine_type из массива в строку
    const cuisine = row.cuisine_type && row.cuisine_type.length > 0
        ? row.cuisine_type[0]
        : undefined;

    // Преобразуем price_level в тип 1-4
    const price = (row.price_level as 1 | 2 | 3 | 4) || 2;

    // Преобразуем rating
    const rating = row.rating || 4.0;

    // Преобразуем sentiment_score в процент
    const sentiment = row.sentiment_score ? Math.round(row.sentiment_score * 100) : 70;

    // Генерируем imageUrl
    const imageUrl = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&sig=${row.id}`;

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
    };
}

export function usePlaces(homeCity: string | null) {
    const [places, setPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPlaces = useCallback(async () => {
        if (!homeCity) {
            setPlaces([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('places')
                .select('*')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            // Фильтруем по городу и стране на уровне базы данных
            // homeCity в формате "City, Country" (например, "Kyiv, Ukraine")
            const parts = homeCity.split(',').map(p => p.trim());
            const homeCityName = parts[0].trim(); // Используем оригинальное название для точного сравнения
            const homeCountryName = parts.length > 1 ? parts[1].trim() : null;

            // Точное сравнение города (case-insensitive)
            query = query.ilike('city', homeCityName);

            // Если указана страна, также фильтруем по стране (точное сравнение)
            if (homeCountryName) {
                query = query.ilike('country', homeCountryName);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            if (data) {
                const convertedPlaces = data
                    .map(convertPlaceRowToPlace)
                    .filter(place => place.latitude !== 0 && place.longitude !== 0);

                setPlaces(convertedPlaces);
            } else {
                setPlaces([]);
            }
        } catch (err) {
            console.error('Error loading places:', err);
            setError(err instanceof Error ? err.message : 'Failed to load places');
            setPlaces([]);
        } finally {
            setLoading(false);
        }
    }, [homeCity]);

    useEffect(() => {
        loadPlaces();
    }, [loadPlaces]);

    return { places, loading, error, refetch: loadPlaces };
}

