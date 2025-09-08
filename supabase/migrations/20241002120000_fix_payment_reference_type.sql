-- Ensure payment_reference column can store non-UUID strings
alter table orders
  add column if not exists payment_reference text;

-- If the column exists with a different type (e.g., uuid), convert it to text
alter table orders
  alter column payment_reference type text using payment_reference::text;
