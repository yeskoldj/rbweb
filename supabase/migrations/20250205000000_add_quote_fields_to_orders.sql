alter table if exists orders add column if not exists quote_reference text;
alter table if exists orders add column if not exists awaiting_quote boolean default false;
update orders set awaiting_quote = true where awaiting_quote is null and quote_reference is not null;
