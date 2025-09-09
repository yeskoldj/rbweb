-- Ensure payment-related reference columns store text values
alter table orders
  alter column p2p_reference drop default,
  alter column p2p_reference type text using p2p_reference::text,
  alter column payment_reference drop default,
  alter column payment_reference type text using payment_reference::text,
  alter column payment_id drop default,
  alter column payment_id type text using payment_id::text;

