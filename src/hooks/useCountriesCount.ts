import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCountriesCount() {
    const [countriesCount, setCountriesCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCountriesCount = async () => {
            try {
                const { data, error } = await supabase
                    .from('places')
                    .select('country')
                    .not('country', 'is', null);

                if (error) {
                    throw error;
                }

                if (data) {
                    const uniqueCountries = new Set(
                        data
                            .map(p => p.country?.trim())
                            .filter((country): country is string => Boolean(country))
                    );
                    setCountriesCount(uniqueCountries.size);
                } else {
                    setCountriesCount(0);
                }
            } catch (err) {
                console.error('Error loading countries count:', err);
                setCountriesCount(null);
            } finally {
                setLoading(false);
            }
        };

        loadCountriesCount();
    }, []);

    return { countriesCount, loading };
}

