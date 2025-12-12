export function getPlaceIconUrl(category: string): string {
    const categoryLower = category.toLowerCase().trim();

    const iconMap: Record<string, string> = {
        'art gallery': '/icons/art-gallery-svgrepo-com.svg',
        'art museum': '/icons/museum-svgrepo-com.svg',
        'bakery': '/icons/bakery-svgrepo-com.svg',
        'bar': '/icons/bar-svgrepo-com.svg',
        'beach': '/icons/beach-svgrepo-com.svg',
        'buddhist': '/icons/religious-buddhist-svgrepo-com.svg',
        'cafe': '/icons/cafe-svgrepo-com.svg',
        'christian': '/icons/religious-christian-svgrepo-com.svg',
        'home': '/icons/home-svgrepo-com.svg',
        'ice cream': '/icons/ice-cream-svgrepo-com.svg',
        'jewish': '/icons/religious-jewish-svgrepo-com.svg',
        'library': '/icons/library-svgrepo-com.svg',
        'marker': '/icons/marker-svgrepo-com.svg',
        'monument': '/icons/monument-svgrepo-com.svg',
        'mountain': '/icons/mountain-svgrepo-com.svg',
        'museum': '/icons/museum-svgrepo-com.svg',
        'music': '/icons/music-svgrepo-com.svg',
        'muslim': '/icons/religious-muslim-svgrepo-com.svg',
        'palace': '/icons/marker-svgrepo-com.svg',
        'castle': '/icons/marker-svgrepo-com.svg',
        'park': '/icons/park-svgrepo-com.svg',
        'piggy': '/icons/piggy-bank-svgrepo-com.svg',
        'place of worship': '/icons/place-of-worship-svgrepo-com.svg',
        'restaurant': '/icons/restaurant-svgrepo-com.svg',
        'shinto': '/icons/religious-shinto-svgrepo-com.svg',
        'stadium': '/icons/stadium-svgrepo-com.svg',
        'take away': '/icons/fast-food-svgrepo-com.svg',
        'theme park': '/icons/amusement-park-svgrepo-com.svg',
    };

    return iconMap[categoryLower] || '/icons/marker-svgrepo-com.svg';
}

