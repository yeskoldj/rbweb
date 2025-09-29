-- Ensure the profiles table can store customer phone numbers
alter table profiles
  add column if not exists phone text;

comment on column profiles.phone is 'Primary contact phone number for the user profile';
