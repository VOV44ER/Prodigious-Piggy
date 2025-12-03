import { ENV } from '@/config/env';

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

export const DEFAULT_CENTER: [number, number] = [-0.1276, 51.5074];
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

export const getMapboxToken = (): string | null => {
  return ENV.MAPBOX_TOKEN || null;
};
