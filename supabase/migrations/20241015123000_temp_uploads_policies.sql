-- Create private bucket for temporary uploads
insert into storage.buckets (id, name, public)
values ('temp-uploads', 'temp-uploads', false)
on conflict (id) do nothing;

-- Allow authenticated uploads with basic validation to the temp-uploads bucket
drop policy if exists "Allow public uploads to temp-uploads" on storage.objects;
create policy "Allow controlled uploads to temp-uploads"
  on storage.objects for insert
  to authenticated, service_role
  with check (
    bucket_id = 'temp-uploads'
    and (
      auth.role() = 'service_role'
      or (
        owner = auth.uid()
        and coalesce((metadata->>'size')::bigint, 0) <= 5 * 1024 * 1024
        and (
          coalesce(metadata->>'mimetype', '') ilike 'image/%'
          or lower(coalesce(metadata->>'mimetype', '')) = 'application/pdf'
        )
      )
    )
  );

-- Allow only owners and employees to read files
-- from the temp-uploads bucket
drop policy if exists "Allow staff to read temp-uploads" on storage.objects;
create policy "Allow staff to read temp-uploads"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'temp-uploads'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner','employee')
    )
  );
