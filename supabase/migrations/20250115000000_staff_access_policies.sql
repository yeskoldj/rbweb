-- Enable RLS on key tables and define access policies

-- Orders table
alter table orders enable row level security;

-- Allow anyone to create orders (e.g. checkout)
drop policy if exists "Public insert orders" on orders;
create policy "Public insert orders"
  on orders for insert
  to public
  with check (true);

-- Allow staff to manage orders
drop policy if exists "Staff manage orders" on orders;
create policy "Staff manage orders"
  on orders for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner','employee')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner','employee')
    )
  );

-- Quotes table
alter table quotes enable row level security;

-- Allow anyone to create quotes
drop policy if exists "Public insert quotes" on quotes;
create policy "Public insert quotes"
  on quotes for insert
  to public
  with check (true);

-- Allow staff to manage quotes
drop policy if exists "Staff manage quotes" on quotes;
create policy "Staff manage quotes"
  on quotes for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner','employee')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('owner','employee')
    )
  );

-- Profiles table
alter table profiles enable row level security;

-- Allow users to manage their own profile
drop policy if exists "Users manage own profile" on profiles;
create policy "Users manage own profile"
  on profiles for all
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Allow staff full access to profiles
drop policy if exists "Staff manage profiles" on profiles;
create policy "Staff manage profiles"
  on profiles for all
  to authenticated
  using (
    exists (
      select 1 from profiles as p
      where p.id = auth.uid()
        and p.role in ('owner','employee')
    )
  )
  with check (
    exists (
      select 1 from profiles as p
      where p.id = auth.uid()
        and p.role in ('owner','employee')
    )
  );
