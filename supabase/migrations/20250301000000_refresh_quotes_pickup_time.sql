alter table if exists quotes
  add column if not exists pickup_time text;

select pg_notify('pgrst', 'reload schema');
