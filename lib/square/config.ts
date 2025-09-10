// lib/square/config.ts

// ---- Public (front-end) Square config (non-secret) ----
// Allow switching between production and sandbox environments at build time.
// If NEXT_PUBLIC_SQUARE_ENV is not defined or set to any value other than
// 'sandbox', the app will default to the production environment.
const env = process.env.NEXT_PUBLIC_SQUARE_ENV === 'sandbox'
  ? 'sandbox'
  : 'production';

export const squareConfig = {
  environment: env,
  bakeryEmail: 'rangerbakery@gmail.com',

  // Choose the correct Square base URL depending on the environment
  baseUrl:
    env === 'sandbox'
      ? 'https://connect.squareupsandbox.com'
      : 'https://connect.squareup.com',
  sandboxUrl: 'https://connect.squareupsandbox.com',

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
