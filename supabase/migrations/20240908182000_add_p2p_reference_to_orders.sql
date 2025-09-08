-- Add p2p_reference column to orders table
alter table orders add column if not exists p2p_reference text;
