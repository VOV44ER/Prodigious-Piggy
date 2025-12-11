import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { getMapboxToken } from "@/integrations/mapbox/client";

interface City {
    name: string;
    lat: number;
    lng: number;
    intensity: number;
}

const cities: City[] = [
    { name: "Casablanca", lat: 33.5731, lng: -7.5898, intensity: 0.9 },
    { name: "Paris", lat: 48.8566, lng: 2.3522, intensity: 0.8 },
    { name: "London", lat: 51.5074, lng: -0.1278, intensity: 0.85 },
    { name: "New York", lat: 40.7128, lng: -74.0060, intensity: 0.75 },
    { name: "Tokyo", lat: 35.6762, lng: 139.6503, intensity: 0.7 },
    { name: "Sydney", lat: -33.8688, lng: 151.2093, intensity: 0.65 },
    { name: "Dubai", lat: 25.2048, lng: 55.2708, intensity: 0.7 },
    { name: "Barcelona", lat: 41.3851, lng: 2.1734, intensity: 0.75 },
    { name: "Rome", lat: 41.9028, lng: 12.4964, intensity: 0.7 },
    { name: "Berlin", lat: 52.5200, lng: 13.4050, intensity: 0.65 },
    { name: "Amsterdam", lat: 52.3676, lng: 4.9041, intensity: 0.7 },
    { name: "Lisbon", lat: 38.7223, lng: -9.1393, intensity: 0.65 },
    { name: "Istanbul", lat: 41.0082, lng: 28.9784, intensity: 0.6 },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777, intensity: 0.6 },
    { name: "Singapore", lat: 1.3521, lng: 103.8198, intensity: 0.65 },
    { name: "Bangkok", lat: 13.7563, lng: 100.5018, intensity: 0.6 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437, intensity: 0.65 },
    { name: "San Francisco", lat: 37.7749, lng: -122.4194, intensity: 0.6 },
    { name: "Chicago", lat: 41.8781, lng: -87.6298, intensity: 0.55 },
    { name: "Toronto", lat: 43.6532, lng: -79.3832, intensity: 0.6 },
    { name: "Mexico City", lat: 19.4326, lng: -99.1332, intensity: 0.55 },
    { name: "São Paulo", lat: -23.5505, lng: -46.6333, intensity: 0.5 },
    { name: "Buenos Aires", lat: -34.6037, lng: -58.3816, intensity: 0.5 },
    { name: "Cape Town", lat: -33.9249, lng: 18.4241, intensity: 0.5 },
    { name: "Cairo", lat: 30.0444, lng: 31.2357, intensity: 0.5 },
    { name: "Seoul", lat: 37.5665, lng: 126.9780, intensity: 0.6 },
    { name: "Hong Kong", lat: 22.3193, lng: 114.1694, intensity: 0.65 },
    { name: "Melbourne", lat: -37.8136, lng: 144.9631, intensity: 0.55 },
    { name: "Vancouver", lat: 49.2827, lng: -123.1207, intensity: 0.5 },
    { name: "Madrid", lat: 40.4168, lng: -3.7038, intensity: 0.7 },
    { name: "Vienna", lat: 48.2082, lng: 16.3738, intensity: 0.6 },
    { name: "Prague", lat: 50.0755, lng: 14.4378, intensity: 0.55 },
    { name: "Warsaw", lat: 52.2297, lng: 21.0122, intensity: 0.5 },
    { name: "Stockholm", lat: 59.3293, lng: 18.0686, intensity: 0.5 },
    { name: "Copenhagen", lat: 55.6761, lng: 12.5683, intensity: 0.55 },
    { name: "Oslo", lat: 59.9139, lng: 10.7522, intensity: 0.45 },
    { name: "Helsinki", lat: 60.1699, lng: 24.9384, intensity: 0.45 },
    { name: "Dublin", lat: 53.3498, lng: -6.2603, intensity: 0.6 },
    { name: "Edinburgh", lat: 55.9533, lng: -3.1883, intensity: 0.5 },
    { name: "Brussels", lat: 50.8503, lng: 4.3517, intensity: 0.6 },
    { name: "Zurich", lat: 47.3769, lng: 8.5417, intensity: 0.55 },
    { name: "Geneva", lat: 46.2044, lng: 6.1432, intensity: 0.5 },
    { name: "Milan", lat: 45.4642, lng: 9.1900, intensity: 0.65 },
    { name: "Florence", lat: 43.7696, lng: 11.2558, intensity: 0.6 },
    { name: "Venice", lat: 45.4408, lng: 12.3155, intensity: 0.55 },
    { name: "Athens", lat: 37.9838, lng: 23.7275, intensity: 0.55 },
    { name: "Budapest", lat: 47.4979, lng: 19.0402, intensity: 0.5 },
    { name: "Krakow", lat: 50.0647, lng: 19.9450, intensity: 0.45 },
    { name: "Porto", lat: 41.1579, lng: -8.6291, intensity: 0.5 },
    { name: "Seville", lat: 37.3891, lng: -5.9845, intensity: 0.5 },
    { name: "Valencia", lat: 39.4699, lng: -0.3763, intensity: 0.45 },
    { name: "Marseille", lat: 43.2965, lng: 5.3698, intensity: 0.55 },
    { name: "Lyon", lat: 45.7640, lng: 4.8357, intensity: 0.5 },
    { name: "Nice", lat: 43.7102, lng: 7.2620, intensity: 0.5 },
    { name: "Monaco", lat: 43.7384, lng: 7.4246, intensity: 0.45 },
    { name: "Luxembourg", lat: 49.6116, lng: 6.1319, intensity: 0.4 },
    { name: "Reykjavik", lat: 64.1466, lng: -21.9426, intensity: 0.4 },
    { name: "Riga", lat: 56.9496, lng: 24.1052, intensity: 0.4 },
    { name: "Tallinn", lat: 59.4370, lng: 24.7536, intensity: 0.4 },
    { name: "Vilnius", lat: 54.6872, lng: 25.2797, intensity: 0.4 },
    { name: "Bucharest", lat: 44.4268, lng: 26.1025, intensity: 0.45 },
    { name: "Sofia", lat: 42.6977, lng: 23.3219, intensity: 0.4 },
    { name: "Belgrade", lat: 44.7866, lng: 20.4489, intensity: 0.4 },
    { name: "Zagreb", lat: 45.8150, lng: 15.9819, intensity: 0.4 },
    { name: "Ljubljana", lat: 46.0569, lng: 14.5058, intensity: 0.35 },
    { name: "Sarajevo", lat: 43.8563, lng: 18.4131, intensity: 0.35 },
    { name: "Skopje", lat: 41.9981, lng: 21.4254, intensity: 0.3 },
    { name: "Tirana", lat: 41.3275, lng: 19.8187, intensity: 0.3 },
    { name: "Podgorica", lat: 42.4304, lng: 19.2594, intensity: 0.3 },
    { name: "Pristina", lat: 42.6629, lng: 21.1655, intensity: 0.3 },
    { name: "Chisinau", lat: 47.0104, lng: 28.8638, intensity: 0.3 },
    { name: "Kiev", lat: 50.4501, lng: 30.5234, intensity: 0.4 },
    { name: "Minsk", lat: 53.9045, lng: 27.5615, intensity: 0.3 },
    { name: "Moscow", lat: 55.7558, lng: 37.6173, intensity: 0.4 },
    { name: "Saint Petersburg", lat: 59.9343, lng: 30.3351, intensity: 0.35 },
    { name: "Tel Aviv", lat: 32.0853, lng: 34.7818, intensity: 0.5 },
    { name: "Jerusalem", lat: 31.7683, lng: 35.2137, intensity: 0.45 },
    { name: "Beirut", lat: 33.8938, lng: 35.5018, intensity: 0.4 },
    { name: "Amman", lat: 31.9539, lng: 35.9106, intensity: 0.35 },
    { name: "Damascus", lat: 33.5138, lng: 36.2765, intensity: 0.3 },
    { name: "Baghdad", lat: 33.3152, lng: 44.3661, intensity: 0.3 },
    { name: "Tehran", lat: 35.6892, lng: 51.3890, intensity: 0.35 },
    { name: "Riyadh", lat: 24.7136, lng: 46.6753, intensity: 0.4 },
    { name: "Jeddah", lat: 21.4858, lng: 39.1925, intensity: 0.35 },
    { name: "Doha", lat: 25.2854, lng: 51.5310, intensity: 0.4 },
    { name: "Kuwait City", lat: 29.3759, lng: 47.9774, intensity: 0.35 },
    { name: "Manama", lat: 26.0667, lng: 50.5577, intensity: 0.3 },
    { name: "Muscat", lat: 23.5859, lng: 58.4059, intensity: 0.3 },
    { name: "Abu Dhabi", lat: 24.4539, lng: 54.3773, intensity: 0.35 },
    { name: "Sharjah", lat: 25.3573, lng: 55.4033, intensity: 0.3 },
    { name: "Lahore", lat: 31.5204, lng: 74.3587, intensity: 0.35 },
    { name: "Karachi", lat: 24.8607, lng: 67.0011, intensity: 0.35 },
    { name: "Islamabad", lat: 33.6844, lng: 73.0479, intensity: 0.3 },
    { name: "Dhaka", lat: 23.8103, lng: 90.4125, intensity: 0.3 },
    { name: "Colombo", lat: 6.9271, lng: 79.8612, intensity: 0.3 },
    { name: "Kathmandu", lat: 27.7172, lng: 85.3240, intensity: 0.25 },
    { name: "Thimphu", lat: 27.4728, lng: 89.6390, intensity: 0.2 },
    { name: "Yangon", lat: 16.8661, lng: 96.1951, intensity: 0.3 },
    { name: "Phnom Penh", lat: 11.5564, lng: 104.9282, intensity: 0.3 },
    { name: "Vientiane", lat: 17.9757, lng: 102.6331, intensity: 0.25 },
    { name: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297, intensity: 0.4 },
    { name: "Hanoi", lat: 21.0285, lng: 105.8542, intensity: 0.35 },
    { name: "Manila", lat: 14.5995, lng: 120.9842, intensity: 0.4 },
    { name: "Jakarta", lat: -6.2088, lng: 106.8456, intensity: 0.4 },
    { name: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, intensity: 0.45 },
    { name: "Penang", lat: 5.4164, lng: 100.3327, intensity: 0.35 },
    { name: "Phuket", lat: 7.8804, lng: 98.3923, intensity: 0.4 },
    { name: "Chiang Mai", lat: 18.7883, lng: 98.9853, intensity: 0.35 },
    { name: "Bali", lat: -8.3405, lng: 115.0920, intensity: 0.4 },
    { name: "Yogyakarta", lat: -7.7956, lng: 110.3695, intensity: 0.3 },
    { name: "Bandung", lat: -6.9175, lng: 107.6191, intensity: 0.3 },
    { name: "Surabaya", lat: -7.2575, lng: 112.7521, intensity: 0.3 },
    { name: "Medan", lat: 3.5952, lng: 98.6722, intensity: 0.25 },
    { name: "Makassar", lat: -5.1477, lng: 119.4327, intensity: 0.25 },
    { name: "Denpasar", lat: -8.6705, lng: 115.2126, intensity: 0.3 },
    { name: "Ubud", lat: -8.5069, lng: 115.2625, intensity: 0.35 },
    { name: "Seminyak", lat: -8.6844, lng: 115.1700, intensity: 0.3 },
    { name: "Canggu", lat: -8.6446, lng: 115.1389, intensity: 0.3 },
    { name: "Sanur", lat: -8.6900, lng: 115.2622, intensity: 0.25 },
    { name: "Nusa Dua", lat: -8.7924, lng: 115.2117, intensity: 0.25 },
    { name: "Jimbaran", lat: -8.7883, lng: 115.1689, intensity: 0.25 },
    { name: "Kuta", lat: -8.7220, lng: 115.1725, intensity: 0.3 },
    { name: "Legian", lat: -8.7000, lng: 115.1700, intensity: 0.25 },
    { name: "Uluwatu", lat: -8.8294, lng: 115.0869, intensity: 0.25 },
    { name: "Amed", lat: -8.3333, lng: 115.6167, intensity: 0.2 },
    { name: "Lovina", lat: -8.1667, lng: 115.0333, intensity: 0.2 },
    { name: "Pemuteran", lat: -8.1333, lng: 114.6833, intensity: 0.2 },
    { name: "Munduk", lat: -8.2667, lng: 115.0833, intensity: 0.2 },
    { name: "Sidemen", lat: -8.5000, lng: 115.4667, intensity: 0.2 },
    { name: "Tabanan", lat: -8.5333, lng: 115.1167, intensity: 0.2 },
    { name: "Gianyar", lat: -8.5333, lng: 115.3167, intensity: 0.2 },
    { name: "Klungkung", lat: -8.5333, lng: 115.4000, intensity: 0.2 },
    { name: "Bangli", lat: -8.4500, lng: 115.3500, intensity: 0.2 },
    { name: "Karangasem", lat: -8.3833, lng: 115.5167, intensity: 0.2 },
    { name: "Jembrana", lat: -8.3000, lng: 114.9667, intensity: 0.2 },
    { name: "Buleleng", lat: -8.1167, lng: 115.0833, intensity: 0.2 },
];

export function WorldCoverageHeatmap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current) return;

        const token = getMapboxToken();
        if (!token) {
            console.error("Mapbox token not found");
            return;
        }

        mapboxgl.accessToken = token;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [0, 20],
            zoom: 1.5,
            minZoom: 1,
            maxZoom: 5,
        });

        map.current.on('load', () => {
            if (!map.current) return;

            const heatmapData = {
                type: 'FeatureCollection' as const,
                features: cities.map(city => ({
                    type: 'Feature' as const,
                    geometry: {
                        type: 'Point' as const,
                        coordinates: [city.lng, city.lat]
                    },
                    properties: {
                        intensity: city.intensity
                    }
                }))
            };

            map.current.addSource('heatmap-source', {
                type: 'geojson',
                data: heatmapData
            });

            map.current.addLayer({
                id: 'heatmap-layer',
                type: 'heatmap',
                source: 'heatmap-source',
                maxzoom: 9,
                paint: {
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'intensity'],
                        0, 0,
                        1, 1
                    ],
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 0.5,
                        3, 1.5,
                        5, 2
                    ],
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(255, 182, 193, 0)',
                        0.2, 'rgba(255, 160, 122, 0.4)',
                        0.4, 'rgba(255, 140, 100, 0.6)',
                        0.6, 'rgba(255, 120, 80, 0.8)',
                        0.8, 'rgba(255, 100, 60, 0.9)',
                        1, 'rgba(255, 80, 40, 1)'
                    ],
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 20,
                        3, 40,
                        5, 60
                    ],
                    'heatmap-opacity': 0.7
                }
            });

            map.current.addLayer({
                id: 'points-layer',
                type: 'circle',
                source: 'heatmap-source',
                minzoom: 2,
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'intensity'],
                        0, 3,
                        1, 8
                    ],
                    'circle-color': 'rgba(255, 182, 193, 0.9)',
                    'circle-stroke-color': 'rgba(255, 182, 193, 1)',
                    'circle-stroke-width': 1,
                    'circle-opacity': 0.8
                }
            });
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    return (
        <div className="relative w-full h-full">
            <div
                ref={mapContainer}
                className="w-full h-full min-h-[500px]"
                style={{ borderRadius: '0 0 8px 8px' }}
            />
        </div>
    );
}

