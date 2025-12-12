import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { getMapboxToken } from "@/integrations/mapbox/client";
import { supabase } from "@/integrations/supabase/client";

interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
}

export function WorldCoverageHeatmap() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const mapLoaded = useRef(false);
    const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPlaces = async () => {
            try {
                const { data, error } = await supabase
                    .from('places')
                    .select('latitude, longitude, city')
                    .not('latitude', 'is', null)
                    .not('longitude', 'is', null);

                if (error) {
                    throw error;
                }

                if (data) {
                    const cityGroups = new Map<string, { lat: number; lng: number; count: number }>();

                    data.forEach(place => {
                        if (place.latitude && place.longitude) {
                            const cityKey = place.city?.trim().toLowerCase() || `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`;

                            if (!cityGroups.has(cityKey)) {
                                cityGroups.set(cityKey, {
                                    lat: place.latitude,
                                    lng: place.longitude,
                                    count: 0
                                });
                            }

                            const city = cityGroups.get(cityKey)!;
                            city.count += 1;
                        }
                    });

                    const counts = Array.from(cityGroups.values()).map(c => c.count);
                    const maxCount = counts.length > 0 ? Math.max(...counts) : 1;

                    const points: HeatmapPoint[] = Array.from(cityGroups.values()).map(city => ({
                        lat: city.lat,
                        lng: city.lng,
                        intensity: maxCount > 0 ? Math.min(city.count / maxCount, 1) : 0.5
                    }));

                    setHeatmapPoints(points);
                }
            } catch (err) {
                console.error('Error loading places for heatmap:', err);
            } finally {
                setLoading(false);
            }
        };

        loadPlaces();
    }, []);

    useEffect(() => {
        if (!mapContainer.current || loading || heatmapPoints.length === 0) return;

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

        const updateHeatmapData = () => {
            if (!map.current || !mapLoaded.current) return;

            const heatmapData = {
                type: 'FeatureCollection' as const,
                features: heatmapPoints.map(point => ({
                    type: 'Feature' as const,
                    geometry: {
                        type: 'Point' as const,
                        coordinates: [point.lng, point.lat]
                    },
                    properties: {
                        intensity: point.intensity
                    }
                }))
            };

            const source = map.current.getSource('heatmap-source') as mapboxgl.GeoJSONSource;
            if (source) {
                source.setData(heatmapData);
            } else {
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
            }
        };

        map.current.on('load', () => {
            mapLoaded.current = true;
            updateHeatmapData();
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
                mapLoaded.current = false;
            }
        };
    }, [loading]);

    useEffect(() => {
        if (map.current && mapLoaded.current && heatmapPoints.length > 0) {
            const heatmapData = {
                type: 'FeatureCollection' as const,
                features: heatmapPoints.map(point => ({
                    type: 'Feature' as const,
                    geometry: {
                        type: 'Point' as const,
                        coordinates: [point.lng, point.lat]
                    },
                    properties: {
                        intensity: point.intensity
                    }
                }))
            };

            const source = map.current.getSource('heatmap-source') as mapboxgl.GeoJSONSource;
            if (source) {
                source.setData(heatmapData);
            }
        }
    }, [heatmapPoints]);

    if (loading) {
        return (
            <div className="relative w-full h-full flex items-center justify-center min-h-[500px]">
                <div className="text-cream/60">Загрузка карты...</div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div
                ref={ mapContainer }
                className="w-full h-full min-h-[500px]"
                style={ { borderRadius: '0 0 8px 8px' } }
            />
        </div>
    );
}

