-- Strengthen and extend row level security policies for core tables

-- Orders table policies -----------------------------------------------------
alter table orders enable row level security;

drop policy if exists "Public insert orders" on orders;
create policy "Public insert orders"
  on orders for insert
  to public
  with check (
    (
      -- Allow guests to create orders without a linked user
      (auth.uid() is null and user_id is null)
      or
      -- Allow authenticated users (staff or customers) to link the order to themselves
      (auth.uid() is not null and (user_id is null or user_id = auth.uid()))
    )
    and
    -- Basic sanity checks for financial values and lifecycle fields
    coalesce(subtotal, 0) >= 0
    and coalesce(tax, 0) >= 0
    and coalesce(total, 0) >= 0
    and coalesce(status, 'pending') = 'pending'
    and coalesce(payment_status, 'pending') in ('pending', 'paid')
  );

-- Allow authenticated users to read their own orders
-- (matched by user id, email, or verified phone number)
drop policy if exists "Customers read own orders" on orders;
create policy "Customers read own orders"
  on orders for select
  to authenticated
  using (
    -- Orders created while logged in
    (user_id is not null and user_id = auth.uid())
    or
    -- Orders linked by email address
    (
      customer_email is not null
      and auth.jwt() ? 'email'
      and lower(customer_email) = lower(auth.jwt()->>'email')
    )
    or
    -- Orders linked by verified phone number stored in the profile
    exists (
      select 1
      from profiles
      where profiles.id = auth.uid()
        and profiles.phone is not null
        and length(trim(profiles.phone)) > 0
        and regexp_replace(profiles.phone, '\D', '', 'g') = regexp_replace(coalesce(customer_phone, ''), '\D', '', 'g')
    )
  );

-- Quotes table policies -----------------------------------------------------
alter table quotes enable row level security;

drop policy if exists "Public insert quotes" on quotes;
create policy "Public insert quotes"
  on quotes for insert
  to public
  with check (
    -- Ensure lifecycle fields remain under bakery control
    coalesce(status, 'pending') = 'pending'
    and coalesce(priority, 'normal') in ('normal', 'high', 'urgent')
    and estimated_price is null
    and responded_at is null
    and admin_notes is null
  );

-- Allow authenticated customers to see their own quote requests
drop policy if exists "Customers read own quotes" on quotes;
create policy "Customers read own quotes"
  on quotes for select
  to authenticated
  using (
    customer_email is not null
    and auth.jwt() ? 'email'
    and lower(customer_email) = lower(auth.jwt()->>'email')
  );

-- Profiles table policies ---------------------------------------------------
alter table profiles enable row level security;

drop policy if exists "Users manage own profile" on profiles;
create policy "Users manage own profile"
  on profiles for all
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and (role is null or role in ('pending', 'customer'))
  );

-- Staff retain elevated access to manage profiles, orders, and quotes
-- Existing "Staff manage orders", "Staff manage quotes", and "Staff manage profiles"
-- policies defined in previous migrations remain in effect.
