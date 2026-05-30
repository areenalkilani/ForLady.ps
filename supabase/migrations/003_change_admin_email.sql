create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role = 'admin' or lower(email) = 'hassahfayg@gmail.com')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, region, city, town, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'region', ''),
    coalesce(new.raw_user_meta_data->>'city', ''),
    coalesce(new.raw_user_meta_data->>'town', ''),
    case when lower(new.email) = 'hassahfayg@gmail.com' then 'admin'::public.user_role else 'customer'::public.user_role end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
    region = excluded.region,
    city = excluded.city,
    town = excluded.town,
    role = case when lower(excluded.email) = 'hassahfayg@gmail.com' then 'admin'::public.user_role else public.profiles.role end;
  return new;
end;
$$;

update public.profiles
set role = 'admin'
where lower(email) = 'hassahfayg@gmail.com';

update public.profiles
set role = 'customer'
where role = 'admin'
  and lower(email) <> 'hassahfayg@gmail.com';
