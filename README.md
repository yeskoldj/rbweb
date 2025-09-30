This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, create a `.env.local` file by copying `.env.example` and filling in the required environment variables. Supabase and Square credentials can be retrieved from your project settings. Set `ALLOWED_ORIGINS` to a comma-separated list of trusted frontend URLs to control CORS for the Supabase Edge Functions (it falls back to `*` during development). When deploying the hardened notification functions you must also configure `BUSINESS_NOTIFICATION_ALLOWLIST` with a comma-separated list of every internal address that should be able to receive operational emails; requests to other recipients will now be rejected. In production you should also provide `ALLOW_SQUARE_SIMULATION=false` to ensure payments fail fast if Square credentials are missing.

After that, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Square payments (solo tarjeta)

The project integrates [Square Web Payments SDK](https://developer.squareup.com/docs/web-payments/overview) to accept card payments. Apple Pay y Google Pay están deshabilitados temporalmente.

1. **Environment variables** – create a `.env.local` file based on `.env.example` and set:
   - `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
   - `NEXT_PUBLIC_SQUARE_LOCATION_ID`
   - `NEXT_PUBLIC_SQUARE_ENV` (`production` or `sandbox`, defaults to `production`)
   - server-side keys `SQUARE_APPLICATION_ID`, `SQUARE_LOCATION_ID`, and `SQUARE_ACCESS_TOKEN` for the Supabase function.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
