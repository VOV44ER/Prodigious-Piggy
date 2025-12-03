// Plausible Analytics Integration Stub
// Self-hosted or cloud Plausible analytics

export const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN || '';
export const PLAUSIBLE_API_HOST = import.meta.env.VITE_PLAUSIBLE_API_HOST || 'https://plausible.io';

export interface PlausibleEvent {
  name: string;
  props?: Record<string, string | number | boolean>;
}

// Track custom event
export const trackEvent = (event: PlausibleEvent): void => {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event.name, { props: event.props });
  } else {
    console.log('[Plausible] Event tracked (dev mode):', event);
  }
};

// Common events for the app
export const PlausibleEvents = {
  SIGNUP: 'Signup',
  LOGIN: 'Login',
  SEARCH: 'Search',
  VIEW_PLACE: 'View Place',
  SAVE_PLACE: 'Save Place',
  CHAT_MESSAGE: 'Chat Message',
  UPGRADE_PLAN: 'Upgrade Plan',
  MAP_INTERACTION: 'Map Interaction',
} as const;

// Type declaration for window.plausible
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}
