alter table if exists orders
  add column if not exists pickup_date date;

alter table if exists quotes
  add column if not exists pickup_date date;
