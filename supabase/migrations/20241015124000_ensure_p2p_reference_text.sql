-- Ensure p2p_reference and payment_reference columns store human-readable references
alter table orders
  alter column p2p_reference drop default,
  alter column p2p_reference type text using p2p_reference::text,
  alter column payment_reference drop default,
  alter column payment_reference type text using payment_reference::text;
