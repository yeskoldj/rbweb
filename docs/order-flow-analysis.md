# Order Flow Analysis

## Intended Experience
The desired journey is:
1. The customer customizes a cake without seeing prices.
2. Once submitted, the bakery dashboard receives every detail of the customization.
3. The owner reviews the request, optionally contacts the customer, and then sets the official price.
4. The system notifies the customer that their quote has been answered and that payment can proceed.
5. The customer sees the approved amount (base price + 3% card fee) in their pending order and can pay it.
6. The bakery continues processing the order with all customization details intact.

## Current Implementation
* **Quote submission** – `submitCakeQuote` packages cart items, customization summary, pickup window, and special notes into the `quotes` table and emails the bakery.【F:app/order/OrderForm.tsx†L520-L640】
* **Owner review** – The dashboard updates quote status/price through `updateQuoteStatus`, which also calls the Supabase Edge Function `send-quote-response` to email the customer once a price is entered.【F:app/dashboard/page.tsx†L726-L806】【F:supabase/functions/send-quote-response/index.ts†L1-L203】
* **Create order from quote** – `finalizeQuote` turns an answered quote into an `orders` row, copying the estimated price, cart snapshot, and notes. The new record is marked `payment_status: 'pending'` so that the customer can pay later.【F:app/dashboard/page.tsx†L808-L918】
* **Customer payment screen** – When the user opens the order via `/order?orderId=…`, the checkout form reuses the stored `subtotal`, `tax`, and `total` fields when calling Square or the P2P handler, without recomputing fees for existing orders.【F:app/order/OrderForm.tsx†L452-L777】
* **Order tracking** – `/track` shows the figures persisted in the order record and links to the payment page with the recorded total.【F:app/track/page.tsx†L365-L427】

## Issues Identified
### 1. 3% surcharge never materializes for owner-approved orders
`finalizeQuote` persists `tax: 0` and `total: quote.estimated_price`, so no surcharge is stored when a quote becomes an order.【F:app/dashboard/page.tsx†L379-L387】 Later, the checkout flow reuses those stored numbers (`calculateSubtotal()` / `calculateTax()` simply return the order’s persisted amounts), so the Square payment uses the same value that omitted the fee.【F:app/order/OrderForm.tsx†L452-L777】 Consequently, the customer pays exactly the owner’s base price, not the expected base + 3%.

### 2. Customer-facing price mirrors the missing fee
The tracking page and payment CTA render the order’s `subtotal`, `tax`, and `total` exactly as saved. Because the record from `finalizeQuote` lacks the surcharge, the customer never sees the higher amount they are supposed to pay.【F:app/track/page.tsx†L402-L427】

### 3. No omnichannel notification beyond email
The quote update flow now emails the customer automatically when a price is recorded, but there is still no SMS/WhatsApp delivery for customers or internal staff without additional integration.【F:app/dashboard/page.tsx†L726-L806】【F:supabase/functions/send-quote-response/index.ts†L1-L203】

## Recommendations
1. When converting a quote to an order, compute and persist the 3% fee (e.g., `tax = subtotal * 0.03; total = subtotal + tax`) so that the stored numbers match the amount the customer must pay.
2. Mirror that surcharge logic in any admin-side price edits so the dashboard and track page stay consistent with checkout totals.
3. Layer an SMS/WhatsApp integration (for example, the WhatsApp Business Cloud API) on top of the existing email triggers so customers and bakery staff receive real-time mobile alerts.
4. Consider persisting the net/base price separately from the fee to support fee-free methods like Zelle while still showing the card total when appropriate.
