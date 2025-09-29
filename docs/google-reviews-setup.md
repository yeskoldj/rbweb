# Google Reviews Integration Guide

This guide explains how to display Google reviews inside the Rangers Bakery website and how to let visitors leave a review that is published on Google. The process requires configuration inside **Google Business Profile**, **Google Cloud Console**, and **Supabase Edge Functions**.

> **Important:** Google does not allow third parties to create reviews on behalf of users. The "Write review" button on the website must send customers to the official Google reviews page for the bakery. Once the integration below is configured, any review that a customer writes there will automatically appear on the website when Google publishes it.

## 1. Confirm the Google Business Profile details

1. Make sure the Rangers Bakery location is verified in [Google Business Profile](https://www.google.com/business/).
2. Review the public address and phone number—they must match what appears on the website so that the Place ID returns the correct location.

## 2. Find the Google Place ID

1. Open the [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder).
2. Search for **“Rangers Bakery 3657 John F. Kennedy Blvd Jersey City NJ 07307”** (or the exact name and address that Google shows for the bakery).
3. Copy the `Place ID` value that appears in the details pane. You will use it in the Supabase function as `GOOGLE_PLACES_PLACE_ID`.

## 3. Create and configure the Google Places API key

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or select) a project that will manage the API key.
2. Enable the **Places API** for that project.
3. Go to **APIs & Services → Credentials → Create credentials → API key**.
4. **Restrict the key** so it can only be used from the Supabase Edge Function. Recommended restrictions:
   - Application restriction: **IP address** for Supabase Edge Functions or **None** if you cannot restrict by IP.
   - API restriction: **Places API**.
5. Copy this value—you will store it as `GOOGLE_PLACES_API_KEY` in Supabase.

## 4. Store the credentials in Supabase Edge Functions

1. Open the Supabase Dashboard for the project that powers the website.
2. Navigate to **Edge Functions → google-reviews → Settings → Environment Variables**.
3. Add the following variables:
   - `GOOGLE_PLACES_API_KEY` – the API key created in the previous step.
   - `GOOGLE_PLACES_PLACE_ID` – the Place ID from section 2.
   - *(Optional)* `GOOGLE_BUSINESS_NAME` – the display name you prefer to show in logs.
4. Redeploy the function so the new environment variables are available:
   ```bash
   supabase functions deploy google-reviews
   ```
   or use the **Deploy** button in the dashboard.

## 5. Verify the integration from the website

1. Ensure the web app is configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` so it can call Supabase Edge Functions.
2. Visit the home page (`/`) and open the **Client Reviews** section.
3. The site calls the `google-reviews` Edge Function:
   - If the credentials are valid, Google’s API responds with the latest rating, total review count, and the 5 most recent reviews. They will appear automatically on the page.
   - If the credentials are missing or incorrect, the component shows a message explaining what is still required.

## 6. Allow customers to leave a Google review

1. Edit the review link in `components/Reviews.tsx` to point to the bakery’s official Google reviews URL.
2. When customers click **Write Review**, a new tab opens with Google’s review dialog. Google handles authentication and publishing.
3. Once Google publishes the review, it will be included automatically the next time the Edge Function fetches data (the component requests fresh data whenever the page loads).

## 7. Troubleshooting tips

- **No reviews appear** – Verify that both environment variables exist and have no trailing spaces. Check the Supabase Edge Function logs for details returned by Google.
- **`REQUEST_DENIED` or `API key is invalid`** – The API key is wrong, not enabled for Places API, or not allowed from the Supabase network. Adjust the key restrictions.
- **`NOT_FOUND`** – The Place ID does not match the Google Business Profile. Repeat Section 2 to confirm the Place ID.
- **Rate limits** – Google Places API has usage limits. If you exceed them, consider enabling billing and monitoring quotas.

Once these steps are complete, the website will display real Google reviews, and every new review that customers publish on Google will show up automatically on the site.
