# Deploying Supabase Edge Functions

This project bundles several Supabase Edge Functions inside `supabase/functions`. Use the helper script below to deploy every function in one go.

## Prerequisites

1. Install dependencies (the script relies on the Supabase CLI published on npm):
   ```bash
   npm install
   ```
2. Authenticate the Supabase CLI if you have not done so already:
   ```bash
   npx supabase login
   ```
   This stores an access token in `~/.supabase` and sets the `SUPABASE_ACCESS_TOKEN` environment variable for the current shell. Alternatively, export `SUPABASE_ACCESS_TOKEN` manually before running the deployment command.
3. Export the Supabase project reference (visible in the dashboard under *Project Settings → General → Reference ID*):
   ```bash
   export SUPABASE_PROJECT_REF=your-project-ref
   ```

## Deploy all functions

Run the script from the repository root to deploy every function directory (excluding shared utilities):

```bash
npm run deploy:supabase:functions
```

The script iterates over each folder in `supabase/functions` that does not start with an underscore (e.g. `_shared`) and calls `npx supabase functions deploy <function> --project-ref $SUPABASE_PROJECT_REF`.

## Troubleshooting

- Ensure that your environment exports both `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`. The script will abort early if the project reference is missing, and the CLI will prompt for authentication if the access token is not available.
- You can deploy a single function manually with:
  ```bash
  npx supabase functions deploy send-notification-email --project-ref "$SUPABASE_PROJECT_REF"
  ```
- If you need to supply additional secrets, run `supabase secrets set` prior to deployment as described in [`docs/supabase-function-secrets.md`](./supabase-function-secrets.md).
