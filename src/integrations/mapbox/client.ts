// Mapbox Integration Stub
// Add your Mapbox public token to Supabase Edge Function Secrets
// or use the input field on MapPage for development

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

export const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566]; // Paris
export const DEFAULT_ZOOM = 12;

export interface MapConfig {
  accessToken: string;
  style?: string;
  center?: [number, number];
  zoom?: number;
}

export const getMapConfig = (accessToken: string): MapConfig => ({
  accessToken,
  style: MAPBOX_STYLE,
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
});

// Placeholder for Mapbox access token
// In production, this should come from Supabase secrets or env
export const getMapboxToken = (): string | null => {
  return import.meta.env.VITE_MAPBOX_TOKEN || null;
};
