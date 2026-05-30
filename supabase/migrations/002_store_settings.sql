create table if not exists public.store_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

drop policy if exists "public read store settings" on public.store_settings;
create policy "public read store settings" on public.store_settings
for select using (true);

drop policy if exists "admin manage store settings" on public.store_settings;
create policy "admin manage store settings" on public.store_settings
for all using (public.is_admin()) with check (public.is_admin());

insert into public.store_settings (key, value) values
  ('whatsapp_url', ''),
  ('instagram_url', ''),
  ('facebook_url', '')
on conflict (key) do nothing;
