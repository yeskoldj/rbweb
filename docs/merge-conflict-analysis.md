# Merge conflict analysis for `work`

## What we know so far
- The branch `work` currently contains commit `1c2a94b` ("Display and notify pickup dates across the dashboard"), which introduces the new `pickupDate` field across the order workflow, shared formatting helpers, and Supabase edge functions.
- When GitHub attempts to merge `work` into `main`, it reports conflicts. Locally we cannot reproduce the merge because direct network access to fetch the latest `main` is blocked (`git fetch` returns HTTP 403). This means the copy of `main` inside this container stops at commit `31aad27`.
- Comparing `work` with its local base (`31aad27`) shows that the risky areas are:
  - `app/order/OrderForm.tsx`, where the structure of `formData`, submission payloads, and validation logic changed to carry both `pickupDate` and `pickupTime`.
  - Supabase client definitions (`lib/supabase.ts`) and the email/edge functions under `supabase/functions/*`, which now expect `pickup_date` to be persisted alongside `pickup_time`.
  - Dashboard surfaces (`app/dashboard/*` and `app/track/page.tsx`) that render pickup metadata.
- Any new work on `main` that touched these same regions (for example, a refactor of the order form, notification helpers, or Supabase schemas) will conflict with the edits above.

## Next steps once `main` is accessible
1. Fetch the latest `main` history and inspect the diverging commits:
   ```bash
   git fetch origin main
   git log --oneline --left-right --graph HEAD...origin/main
   ```
2. Attempt a merge (or rebase) to surface the exact conflict list:
   ```bash
   git merge origin/main
   # or
   git rebase origin/main
   ```
   Note the files that Git marks as conflicted—expect `app/order/OrderForm.tsx`, `lib/supabase.ts`, and any Supabase function touched by the new `pickupDate` plumbing.
3. For each conflicted file:
   - Preserve the new pickup-date functionality from `work`.
   - Incorporate any structural refactors from `origin/main` (e.g., new form abstractions, schema changes, or notification templates).
   - Run `pnpm lint` and relevant end-to-end checks to ensure the combined logic is consistent.
4. Once conflicts are resolved, continue with the merge or finish the rebase, then push the updated branch so GitHub can create the merge commit successfully.

## Temporary workaround inside this container
Until outbound network access is restored, we cannot validate the conflicts locally. If immediate conflict resolution is required, request a fresh bundle of the up-to-date `main` branch so the reconciliation can be performed offline, or manually paste the conflicting sections from the GitHub UI into this workspace for integration.
