-- Ensure p2p_reference column stores human-readable references
alter table orders
  alter column p2p_reference drop default,
  alter column p2p_reference type text using p2p_reference::text;
