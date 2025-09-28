alter table if exists quotes add column if not exists cart_items jsonb default '[]'::jsonb;
alter table if exists quotes add column if not exists requires_cake_quote boolean default false;
alter table if exists quotes add column if not exists pickup_time text;
alter table if exists quotes add column if not exists special_requests text;
alter table if exists quotes add column if not exists reference_code text;
