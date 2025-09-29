alter table if exists quotes
  add column if not exists pickup_time text;

notify pgrst, 'reload schema';
