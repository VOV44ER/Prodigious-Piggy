// Environment Configuration
// All environment variables should be prefixed with VITE_ for client-side access

export const ENV = {
  // App
  APP_NAME: 'The Prodigious Piggy',
  APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:8080',

  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',

  // Mapbox
  MAPBOX_TOKEN: import.meta.env.VITE_MAPBOX_TOKEN || '',

  // Paddle
  PADDLE_VENDOR_ID: import.meta.env.VITE_PADDLE_VENDOR_ID || '',
  PADDLE_SANDBOX: import.meta.env.VITE_PADDLE_SANDBOX === 'true',

  // Plausible
  PLAUSIBLE_DOMAIN: import.meta.env.VITE_PLAUSIBLE_DOMAIN || '',
  PLAUSIBLE_API_HOST: import.meta.env.VITE_PLAUSIBLE_API_HOST || 'https://plausible.io',

  // OpenAI
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',

  // Feature Flags
  ENABLE_AI_CHAT: import.meta.env.VITE_ENABLE_AI_CHAT !== 'false',
  ENABLE_MAP: import.meta.env.VITE_ENABLE_MAP !== 'false',

  // Mode
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

// Validation helper
export const validateEnv = (): { valid: boolean; missing: string[] } => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);

  return {
    valid: missing.length === 0,
    missing,
  };
};
