-- Add payment_reference column to store non-UUID payment identifiers
alter table orders add column if not exists payment_reference text;
