// lib/square/config.ts

// ---- Public (front-end) Square config (non-secret) ----
export const squareConfig = {
  // Use production by default; switch to sandbox only for testing
  environment: 'production',
  bakeryEmail: 'rangerbakery@gmail.com',

  baseUrl: 'https://connect.squareup.com', // Production
  sandboxUrl: 'https://connect.squareupsandbox.com', // Sandbox

  paymentOptions: {
    currency: 'USD',
    country: 'US',
    acceptedCards: ['visa', 'mastercard', 'amex', 'discover'],
    allowTip: true,
    showReceipt: true,
  },
};

// Apple Pay y Google Pay deshabilitados; walletOptions removido

// ---- Supabase Edge Function names ----
export const EDGE_FUNCTIONS = {
  p2p: 'p2p-payment',
  square: 'square-payment',
} as const;
