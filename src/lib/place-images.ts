const categoryImageMap: Record<string, { prefix: string; count: number }> = {
    'restaurant': { prefix: 'restaurants', count: 3 },
    'cafe': { prefix: 'cafes', count: 6 },
    'bar': { prefix: 'bar', count: 4 },
    'bakery': { prefix: 'bakery', count: 4 },
    'brewpub': { prefix: 'brewpub', count: 2 },
    'wine bar': { prefix: 'winebar', count: 3 },
    'winebar': { prefix: 'winebar', count: 3 },
    'food truck': { prefix: 'restaurants', count: 3 },
    'food_truck': { prefix: 'restaurants', count: 3 },
    'market': { prefix: 'restaurants', count: 3 },
};

export function getPlaceImageUrl(category: string, placeName?: string, address?: string): string | null {
    const categoryLower = category.toLowerCase().trim();

    const imageConfig = categoryImageMap[categoryLower];

    if (!imageConfig) {
        return null;
    }

    const { prefix, count } = imageConfig;

    let imageIndex: number;

    if (placeName) {
        // Use a better hash function that combines name and address for better distribution
        const seed = placeName + (address || '');
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Use absolute value and add some variation
        imageIndex = (Math.abs(hash) % count) + 1;
    } else {
        imageIndex = Math.floor(Math.random() * count) + 1;
    }

    return `/images/${prefix}_${imageIndex}.jpg`;
}

