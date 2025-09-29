create extension if not exists "pgcrypto";

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  occasion text,
  age_group text,
  theme text,
  servings text,
  budget text,
  event_date text,
  event_details text,
  has_reference_photo boolean not null default false,
  photo_description text,
  reference_photo_url text,
  status text not null default 'pending',
  priority text not null default 'normal',
  estimated_price numeric(10,2),
  admin_notes text,
  responded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  cart_items jsonb not null default '[]'::jsonb,
  requires_cake_quote boolean not null default false,
  pickup_time text,
  special_requests text,
  reference_code text,
  unique(reference_code)
);

create index if not exists quotes_created_at_idx on quotes (created_at desc);
create index if not exists quotes_status_idx on quotes (status);

notify pgrst, 'reload schema';
