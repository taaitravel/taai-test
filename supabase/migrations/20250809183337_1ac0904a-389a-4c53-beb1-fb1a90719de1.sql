-- Harmonize metadata keys in trigger function to support both legacy and new keys
create or replace function public.handle_new_user_to_users()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (
    userid, email, first_name, last_name, username, user_type, comp_name,
    address, city, state, zip, country, cell, terms_version
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', null),
    coalesce(new.raw_user_meta_data ->> 'last_name', null),
    coalesce(new.raw_user_meta_data ->> 'username', null),
    coalesce(new.raw_user_meta_data ->> 'user_type', 'individual'),
    coalesce(new.raw_user_meta_data ->> 'comp_name', new.raw_user_meta_data ->> 'company_name'),
    coalesce(new.raw_user_meta_data ->> 'address', new.raw_user_meta_data ->> 'registered_address'),
    coalesce(new.raw_user_meta_data ->> 'city', null),
    coalesce(new.raw_user_meta_data ->> 'state', null),
    coalesce(new.raw_user_meta_data ->> 'zip', null),
    coalesce(new.raw_user_meta_data ->> 'country', null),
    coalesce(new.raw_user_meta_data ->> 'cell', new.raw_user_meta_data ->> 'phone'),
    coalesce(new.raw_user_meta_data ->> 'terms_version', '1.0')
  )
  on conflict (userid) do nothing;

  return new;
end;
$$;