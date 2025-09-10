-- Replace single billing_address field with detailed billing address columns
alter table orders
  drop column if exists billing_address,
  add column if not exists billing_address1 text,
  add column if not exists billing_address2 text,
  add column if not exists billing_city text,
  add column if not exists billing_state text,
  add column if not exists billing_zipcode text;
