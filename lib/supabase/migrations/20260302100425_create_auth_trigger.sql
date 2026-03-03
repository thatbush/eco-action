-- Function that fires on every new auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'user',  -- safe default; org sign-up flow upgrades this to 'org'
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.email
    )
  );
  return new;
end;
$$;

-- Trigger: fires AFTER every INSERT on auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();