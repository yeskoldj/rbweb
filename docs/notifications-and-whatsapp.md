# Notification Channels Overview

## Email notifications that are already live
- **Quote approval (`send-quote-response`)** – When the bakery marks a quote as responded with a price, the dashboard calls the Supabase Edge Function `send-quote-response`. The function updates the `quotes` row and emails the customer using FormSubmit. The HTML message includes greeting, optional event details, the approved estimated price, the admin notes block, and calls to action for calling or confirming via WhatsApp.【F:app/dashboard/page.tsx†L726-L806】【F:supabase/functions/send-quote-response/index.ts†L1-L203】
- **Order ready for payment (`send-notification-email`)** – When an order transitions to `payment_ready`, the app hits the `send-notification-email` Edge Function with the `customer_order_payment_ready` template. Customers receive a branded HTML email summarizing totals, notes, and a pay-now button; the bakery can reuse the same function to alert internal addresses about new orders.【F:supabase/functions/send-notification-email/index.ts†L1-L200】【F:supabase/functions/send-notification-email/index.ts†L200-L400】

## Adding WhatsApp Business Cloud API push messages
To extend the same triggers with WhatsApp messages you only need configuration plus a small fetch call to Meta's Graph API:

1. **Create the Business app** – In Meta Business Manager, enable WhatsApp Business Cloud API, verify the business, and generate the permanent access token and `phone_number_id` for the sending number. Register at least one template that mirrors the email content (e.g., quote approved, order ready).
2. **Store the credentials as Supabase Edge Function secrets** – Add the following environment variables so both Edge Functions can read them:
   - `WHATSAPP_TOKEN` – Permanent or long-lived access token.
   - `WHATSAPP_PHONE_NUMBER_ID` – The sender `phone_number_id` returned by Meta.
   - `WHATSAPP_TEMPLATE_QUOTE_APPROVED` and `WHATSAPP_TEMPLATE_PAYMENT_READY` – Optional helper IDs/names for your approved message templates.
   - `BAKERY_WHATSAPP_RECIPIENTS` – Comma-separated list of internal bakery numbers for admin alerts.

   Set them with the Supabase CLI (`supabase secrets set --env-file supabase/.env.whatsapp`) or through the Dashboard under *Project Settings → API → Edge Function secrets*. They become available via `Deno.env.get()` inside `send-quote-response` and `send-notification-email`.
3. **Send the message after the email** – Inside each function, after the existing email logic succeeds, call:
   ```ts
   await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
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
         language: { code: 'es' },
         components: [/* ... */],
       },
     }),
   })
   ```
   Make the call conditional so the email is still sent even if WhatsApp fails, and loop through `BAKERY_WHATSAPP_RECIPIENTS` to notify internal staff.
4. **Capture phone numbers** – Ensure quotes and orders store `customer_phone` so the Edge Functions know where to send the WhatsApp template. The dashboard already displays the phone number and can pass it through the existing payloads.【F:app/dashboard/page.tsx†L726-L918】

With those credentials in place, the WhatsApp logic lives beside the current email flow, reusing the same triggers without creating a separate job scheduler.
