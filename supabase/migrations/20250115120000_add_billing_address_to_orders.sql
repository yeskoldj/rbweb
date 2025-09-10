-- Add billing_address column to store customer billing addresses
alter table orders add column if not exists billing_address text;
