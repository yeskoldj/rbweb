-- Create private bucket for temporary uploads
insert into storage.buckets (id, name, public)
values ('temp-uploads', 'temp-uploads', false)
on conflict (id) do nothing;

-- Allow anyone (even unauthenticated) to upload files
-- to the temp-uploads bucket
drop policy if exists "Allow public uploads to temp-uploads" on storage.objects;
create policy "Allow public uploads to temp-uploads"
  on storage.objects for insert
  to public
  with check (bucket_id = 'temp-uploads');

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
