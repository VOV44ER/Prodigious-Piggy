// Paddle Payment Integration Stub
// Sandbox mode for development

export const PADDLE_SANDBOX = true;
export const PADDLE_VENDOR_ID = import.meta.env.VITE_PADDLE_VENDOR_ID || '';

export interface PaddleProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval?: 'month' | 'year';
}

export interface PaddleCheckoutOptions {
  product: string;
  email?: string;
  passthrough?: string;
  successCallback?: () => void;
  closeCallback?: () => void;
}

// Product IDs - replace with your actual Paddle product IDs
export const PaddleProducts = {
  PRO_MONTHLY: 'pro_monthly_placeholder',
  PRO_YEARLY: 'pro_yearly_placeholder',
  BUSINESS_MONTHLY: 'business_monthly_placeholder',
  BUSINESS_YEARLY: 'business_yearly_placeholder',
} as const;

// Initialize Paddle
export const initPaddle = (): void => {
  if (typeof window !== 'undefined' && window.Paddle) {
    window.Paddle.Setup({
      vendor: parseInt(PADDLE_VENDOR_ID, 10),
      ...(PADDLE_SANDBOX && { environment: 'sandbox' }),
    });
  } else {
    console.log('[Paddle] SDK not loaded yet');
  }
};

// Open checkout
export const openCheckout = (options: PaddleCheckoutOptions): void => {
  if (typeof window !== 'undefined' && window.Paddle) {
    window.Paddle.Checkout.open(options);
  } else {
    console.log('[Paddle] Checkout (dev mode):', options);
  }
};

// Type declaration for window.Paddle
declare global {
  interface Window {
    Paddle?: {
      Setup: (options: { vendor: number; environment?: string }) => void;
      Checkout: {
        open: (options: PaddleCheckoutOptions) => void;
      };
    };
  }
}
