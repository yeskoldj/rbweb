-- Add payment_type column to orders to track payment method
alter table orders add column if not exists payment_type text;
