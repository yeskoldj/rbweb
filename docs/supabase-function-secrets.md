# Supabase Function Secrets Setup

Use this checklist to configure the environment variables that every Edge Function depends on. You can manage them from the Supabase Dashboard (**Project Settings → API → Function secrets**) or with the CLI:

```bash
supabase secrets set --env-file supabase/.env.functions
```

After updating secrets, redeploy the affected functions so Deno picks up the new values.

## 1. Shared by all functions
Set these first—they allow each Edge Function to talk to Supabase securely and to validate CORS requests.

| Variable | Description | Referenced in |
| --- | --- | --- |
| `SUPABASE_URL` | Base URL of your project. | `send-quote-response`, `send-notification-email`, `p2p-payment`, `square-payment`.【F:supabase/functions/send-quote-response/index.ts†L45-L85】【F:supabase/functions/send-notification-email/index.ts†L52-L96】【F:supabase/functions/p2p-payment/index.ts†L1-L47】【F:supabase/functions/square-payment/index.ts†L17-L90】 |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key with elevated permissions used by server-side helpers. | Same as above. |
| `NODE_ENV` | Controls environment-sensitive defaults (e.g., logging, allowed origins). | All functions.【F:supabase/functions/send-quote-response/index.ts†L9-L33】【F:supabase/functions/send-notification-email/index.ts†L12-L43】【F:supabase/functions/google-reviews/index.ts†L3-L35】 |
| `ALLOWED_ORIGIN` | Whitelisted domain for browser calls; falls back to `*` in development. | All HTTP handlers.【F:supabase/functions/send-quote-response/index.ts†L11-L43】【F:supabase/functions/send-notification-email/index.ts†L13-L43】【F:supabase/functions/google-reviews/index.ts†L3-L35】 |

## 2. Square payments
Required for the `square-payment` function and any frontend requests that create Square orders.

| Variable | Description | Referenced in |
| --- | --- | --- |
| `SQUARE_ACCESS_TOKEN` | Backend access token from Square Developer Dashboard. | `square-payment`.【F:supabase/functions/square-payment/index.ts†L5-L116】 |
| `SQUARE_APPLICATION_ID` | Public app identifier used in fetch responses. | `square-payment`.【F:supabase/functions/square-payment/index.ts†L5-L116】 |
| `SQUARE_LOCATION_ID` | Location to charge. | `square-payment`.【F:supabase/functions/square-payment/index.ts†L5-L116】 |
| `SQUARE_ENV` | `production` or `sandbox`; toggles Square endpoints. | `square-payment`.【F:supabase/functions/square-payment/index.ts†L5-L116】 |

## 3. Email + WhatsApp notifications
These power `send-notification-email`, `send-quote-response`, and the shared WhatsApp helper.

| Variable | Purpose | Referenced in |
| --- | --- | --- |
| `RESEND_API_KEY` | Sends transactional emails through Resend. | `send-notification-email`.【F:supabase/functions/send-notification-email/index.ts†L12-L1034】 |
| `PUBLIC_APP_BASE_URL` | Base URL for payment and tracking links in emails. | `send-notification-email`.【F:supabase/functions/send-notification-email/index.ts†L14-L245】 |
| `WHATSAPP_TOKEN` | WhatsApp Business API token. | `_shared/whatsapp`.【F:supabase/functions/_shared/whatsapp.ts†L1-L111】 |
| `WHATSAPP_PHONE_NUMBER_ID` | Sender phone number ID from Meta. | `_shared/whatsapp`.【F:supabase/functions/_shared/whatsapp.ts†L1-L111】 |
| `WHATSAPP_GRAPH_VERSION` | Optional Graph API version (default `v18.0`). | `_shared/whatsapp`.【F:supabase/functions/_shared/whatsapp.ts†L1-L58】 |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Template language code (default `es`). | `_shared/whatsapp`, notification functions.【F:supabase/functions/_shared/whatsapp.ts†L1-L111】【F:supabase/functions/send-notification-email/index.ts†L17-L245】 |
| `WHATSAPP_BUSINESS_RECIPIENTS` | Comma-separated admin numbers for internal alerts. | `_shared/whatsapp`.【F:supabase/functions/_shared/whatsapp.ts†L83-L111】 |
| `WHATSAPP_TEMPLATE_CUSTOMER_*` | Optional template identifiers for customer messages. | `send-notification-email`.【F:supabase/functions/send-notification-email/index.ts†L17-L245】 |
| `WHATSAPP_TEMPLATE_BUSINESS_*` | Optional template identifiers for internal alerts. | `send-quote-response`, `send-notification-email`.【F:supabase/functions/send-quote-response/index.ts†L234-L276】【F:supabase/functions/send-notification-email/index.ts†L17-L245】 |

## 4. Google Reviews
Needed for the `google-reviews` function that powers the homepage reviews block.

| Variable | Description | Referenced in |
| --- | --- | --- |
| `GOOGLE_PLACES_API_KEY` | Google Cloud API key with Places API enabled. | `google-reviews`.【F:supabase/functions/google-reviews/index.ts†L23-L69】 |
| `GOOGLE_PLACES_PLACE_ID` | Place ID of the bakery location. | `google-reviews`.【F:supabase/functions/google-reviews/index.ts†L23-L69】 |
| `GOOGLE_BUSINESS_NAME` | Optional display name for logging. | `google-reviews`.【F:supabase/functions/google-reviews/index.ts†L23-L69】 |

## 5. Deploy updated functions
After saving the secrets, redeploy the functions that rely on them. From the repo root run:

```bash
supabase functions deploy --project-ref <your-project-ref>
```

Or trigger a deploy for individual functions from the Supabase Dashboard.
