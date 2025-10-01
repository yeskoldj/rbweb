# Notification Channels Overview

## Email notifications that are already live
- **Quote approval (`send-quote-response`)** – When the bakery marks a quote as responded with a price, the dashboard calls the Supabase Edge Function `send-quote-response`. The function updates the `quotes` row and emails the customer using FormSubmit. The HTML message includes greeting, optional event details, the approved estimated price, the admin notes block, and calls to action for calling or confirming via WhatsApp.【F:app/dashboard/page.tsx†L726-L806】【F:supabase/functions/send-quote-response/index.ts†L1-L203】
- **Order ready for payment (`send-notification-email`)** – When an order transitions to `payment_ready`, the app hits the `send-notification-email` Edge Function with the `customer_order_payment_ready` template. Customers receive a branded HTML email summarizing totals, notes, and a pay-now button; the bakery can reuse the same function to alert internal addresses about new orders.【F:supabase/functions/send-notification-email/index.ts†L1-L200】【F:supabase/functions/send-notification-email/index.ts†L200-L400】

### Order and quote notifications flow
- The web app calls `notifyBusinessAboutOrder` after a new order is submitted. The helper collects the business email plus any comma-separated employee addresses and posts to the Supabase Edge Function with the `business_new_order` template.【F:lib/orderNotifications.ts†L24-L88】
- The Edge Function normalizes the payload, picks the correct HTML template, and sends the message through Resend. If the `RESEND_API_KEY` secret is missing, it now logs an error and returns an explicit failure so the client surfaces the misconfiguration instead of simulating success.【F:supabase/functions/send-notification-email/index.ts†L300-L390】【F:supabase/functions/send-notification-email/index.ts†L1004-L1034】

### Required configuration for emails
**Frontend (`.env.local`)**
- `NEXT_PUBLIC_BUSINESS_NOTIFICATION_EMAIL` – Primary business inbox for order alerts.【F:lib/orderNotifications.ts†L30-L48】
- `NEXT_PUBLIC_EMPLOYEE_NOTIFICATION_EMAILS` – Optional comma-separated list of staff addresses that should also receive alerts.【F:lib/orderNotifications.ts†L31-L48】

**Supabase Edge Function secrets**
- `RESEND_API_KEY` – API key used by `send-notification-email` to dispatch HTML emails via Resend.【F:supabase/functions/send-notification-email/index.ts†L12-L53】【F:supabase/functions/send-notification-email/index.ts†L1004-L1034】
- `PUBLIC_APP_BASE_URL` – Base URL for generating payment/tracking links that are embedded in the email templates.【F:supabase/functions/send-notification-email/index.ts†L14-L33】
- `BUSINESS_NOTIFICATION_ALLOWLIST` – Comma-separated list of internal inboxes permitted to receive operational alerts. Any recipient outside of this allowlist is rejected by the function, so include both the primary bakery inbox and every employee alias you expect to notify.【F:supabase/functions/send-notification-email/index.ts†L35-L107】【F:supabase/functions/send-notification-email/index.ts†L320-L387】
- Optionally configure `WHATSAPP_TEMPLATE_*` secrets if you also want WhatsApp pushes (see below). When these values are missing the function simply skips the WhatsApp calls and still sends the email.【F:supabase/functions/send-notification-email/index.ts†L18-L245】

All clients invoking the Edge Function must now send a valid Supabase access token in the `Authorization` header; helpers such as `notifyBusinessAboutOrder` automatically retrieve the current session token before posting the payload.【F:lib/orderNotifications.ts†L54-L88】【F:supabase/functions/send-notification-email/index.ts†L312-L372】

During development configure a Resend test key (or another provider) before exercising the flow; without `RESEND_API_KEY` the function now fails fast to highlight the missing dependency. In production set the secret through `supabase secrets set` so that Resend receives the request and delivers the notifications.【F:supabase/functions/send-notification-email/index.ts†L334-L367】【F:supabase/functions/send-notification-email/index.ts†L1004-L1034】

## Adding WhatsApp Business Cloud API push messages
To extend the same triggers with WhatsApp messages you only need configuration plus a small fetch call to Meta's Graph API:

1. **Create the Business app** – In Meta Business Manager, enable WhatsApp Business Cloud API, verify the business, and generate the permanent access token and `phone_number_id` for the sending number. Register at least one template that mirrors the email content (e.g., quote approved, order ready).
2. **Store the credentials as Supabase Edge Function secrets** – Add the following environment variables so both Edge Functions can read them:
   - `WHATSAPP_TOKEN` – Permanent or long-lived access token.
   - `WHATSAPP_PHONE_NUMBER_ID` – The sender `phone_number_id` returned by Meta.
   - `WHATSAPP_GRAPH_VERSION` – Optional override for the WhatsApp Graph API version (defaults to `v18.0`).
   - `WHATSAPP_TEMPLATE_LANGUAGE` – ISO language code used in your approved templates (defaults to `es`).
   - `WHATSAPP_BUSINESS_RECIPIENTS` – Comma-separated list of internal bakery numbers for admin alerts.
   - `WHATSAPP_TEMPLATE_CUSTOMER_*` / `WHATSAPP_TEMPLATE_BUSINESS_*` – Optional helper IDs/names for your approved message templates.

   Set them with the Supabase CLI (for example, `supabase secrets set --env-file supabase/.env.whatsapp`) or through the Dashboard under *Project Settings → API → Function secrets*. They become available via `Deno.env.get()` inside `send-quote-response`, `_shared/whatsapp`, and `send-notification-email`.【F:supabase/functions/_shared/whatsapp.ts†L1-L111】【F:supabase/functions/send-quote-response/index.ts†L234-L276】【F:supabase/functions/send-notification-email/index.ts†L17-L245】
3. **Send the message after the email** – Inside each function, after the existing email logic succeeds, call:
   ```ts
   await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       Authorization: `Bearer ${accessToken}`,
     },
     body: JSON.stringify({
       messaging_product: 'whatsapp',
       to: customerPhone,
       type: 'template',
       template: {
         name: templateName,
         language: { code: whatsappLanguage },
         components: [/* ... */],
       },
     }),
   })
   ```
   Make the call conditional so the email is still sent even if WhatsApp fails, and loop through `WHATSAPP_BUSINESS_RECIPIENTS` to notify internal staff.
4. **Capture phone numbers** – Ensure quotes and orders store `customer_phone` so the Edge Functions know where to send the WhatsApp template. The dashboard already displays the phone number and can pass it through the existing payloads.【F:app/dashboard/page.tsx†L726-L918】

With those credentials in place, the WhatsApp logic lives beside the current email flow, reusing the same triggers without creating a separate job scheduler.
