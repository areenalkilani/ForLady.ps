create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_status as enum ('active', 'draft', 'hidden', 'sold_out');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_type as enum ('image', 'video');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text not null default '',
  region text not null default '',
  city text not null default '',
  town text not null default '',
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  description text,
  image_path text,
  visible boolean not null default true,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  name_en text,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  original_price numeric(12,2) check (original_price is null or original_price >= 0),
  discount numeric(5,2) not null default 0 check (discount >= 0 and discount <= 100),
  sku text unique,
  tags text[] not null default '{}',
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  bestseller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  hex text not null default '#000000',
  sold_out boolean not null default false,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, name)
);

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  color_id uuid not null references public.product_colors(id) on delete cascade,
  media_type public.media_type not null,
  path text not null,
  sort_order integer not null default 999,
  created_at timestamptz not null default now()
);

create table if not exists public.product_inventory (
  id uuid primary key default gen_random_uuid(),
  color_id uuid not null references public.product_colors(id) on delete cascade,
  size text not null,
  quantity integer not null default 0 check (quantity >= 0),
  low_stock_threshold integer not null default 3,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(color_id, size)
);

create table if not exists public.delivery_fees (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price numeric(12,2) not null default 0 check (price >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_path text,
  visible boolean not null default true,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  region text not null,
  city text not null,
  village text,
  address text not null,
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null check (delivery_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  status public.order_status not null default 'pending',
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  color_id uuid references public.product_colors(id) on delete set null,
  product_name text not null,
  product_image text,
  color_name text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  data jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_product_colors_product on public.product_colors(product_id);
create index if not exists idx_inventory_color_size on public.product_inventory(color_id, size);
create index if not exists idx_orders_status_created on public.orders(status, created_at desc);
create index if not exists idx_orders_phone on public.orders(customer_phone);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read, created_at desc);

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
      and (role = 'admin' or email = 'hassahfayg@gmail.com')
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.refresh_inventory_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_color uuid;
  target_product uuid;
begin
  target_color := coalesce(new.color_id, old.color_id);

  update public.product_inventory
  set available = quantity > 0,
      updated_at = now()
  where color_id = target_color;

  update public.product_colors c
  set sold_out = not exists (
    select 1 from public.product_inventory i
    where i.color_id = c.id and i.quantity > 0
  ),
  updated_at = now()
  where c.id = target_color
  returning product_id into target_product;

  update public.products p
  set status = case
    when exists (
      select 1 from public.product_colors c
      join public.product_inventory i on i.color_id = c.id
      where c.product_id = p.id and i.quantity > 0
    ) then case when p.status = 'sold_out' then 'active'::public.product_status else p.status end
    else 'sold_out'::public.product_status
  end,
  updated_at = now()
  where p.id = target_product;

  insert into public.notifications (user_id, title, body, type, data)
  select pr.id, 'تنبيه مخزون منخفض', 'كمية أحد المنتجات أصبحت منخفضة', 'low_stock',
    jsonb_build_object('color_id', target_color)
  from public.profiles pr
  where pr.role = 'admin'
    and exists (
      select 1 from public.product_inventory i
      where i.color_id = target_color and i.quantity > 0 and i.quantity <= i.low_stock_threshold
    );

  return coalesce(new, old);
end;
$$;

drop trigger if exists product_inventory_status_trigger on public.product_inventory;
create trigger product_inventory_status_trigger
after insert or update of quantity on public.product_inventory
for each row execute function public.refresh_inventory_status();

create or replace function public.notify_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, title, body, type, data)
    select id, 'طلب جديد', 'تم استلام طلب جديد من ' || new.customer_name, 'new_order', jsonb_build_object('order_id', new.id)
    from public.profiles where role = 'admin';
  elsif old.status is distinct from new.status then
    if new.status = 'cancelled' then
      insert into public.notifications (user_id, title, body, type, data)
      select id, 'تم إلغاء طلب', 'تم إلغاء الطلب #' || new.id, 'order_cancelled', jsonb_build_object('order_id', new.id)
      from public.profiles where role = 'admin';
    end if;

    if new.user_id is not null then
      insert into public.notifications (user_id, title, body, type, data)
      values (new.user_id, 'تحديث حالة الطلب', 'حالة طلبك أصبحت: ' || new.status, 'order_status', jsonb_build_object('order_id', new.id, 'status', new.status));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_notify_trigger on public.orders;
create trigger orders_notify_trigger
after insert or update of status on public.orders
for each row execute function public.notify_order_status();

create or replace function public.place_order(order_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  order_id uuid;
  item jsonb;
  color_row public.product_colors%rowtype;
  inventory_row public.product_inventory%rowtype;
  current_user_id uuid := auth.uid();
begin
  insert into public.orders (
    user_id, customer_name, customer_email, customer_phone, region, city, village,
    address, subtotal, delivery_fee, total
  )
  values (
    current_user_id,
    order_payload->>'customer_name',
    nullif(order_payload->>'customer_email', ''),
    order_payload->>'customer_phone',
    order_payload->>'region',
    order_payload->>'city',
    nullif(order_payload->>'village', ''),
    order_payload->>'address',
    (order_payload->>'subtotal')::numeric,
    (order_payload->>'delivery_fee')::numeric,
    (order_payload->>'total')::numeric
  )
  returning id into order_id;

  for item in select * from jsonb_array_elements(order_payload->'items') loop
    select * into color_row
    from public.product_colors
    where product_id = (item->>'productId')::uuid
      and name = item->>'color'
    limit 1;

    if color_row.id is null then
      raise exception 'Color not found for product %', item->>'productId';
    end if;

    select * into inventory_row
    from public.product_inventory
    where color_id = color_row.id
      and size = item->>'size'
    for update;

    if inventory_row.id is null or inventory_row.quantity < (item->>'quantity')::integer then
      raise exception 'Insufficient stock for % / %', item->>'color', item->>'size';
    end if;

    update public.product_inventory
    set quantity = quantity - (item->>'quantity')::integer
    where id = inventory_row.id;

    insert into public.order_items (
      order_id, product_id, color_id, product_name, product_image,
      color_name, size, quantity, unit_price
    )
    values (
      order_id,
      (item->>'productId')::uuid,
      color_row.id,
      item->>'productName',
      item->>'productImage',
      item->>'color',
      item->>'size',
      (item->>'quantity')::integer,
      (item->>'price')::numeric
    );
  end loop;

  return order_id;
end;
$$;

create or replace function public.admin_dashboard_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_admin() then jsonb_build_object(
    'total_orders', (select count(*) from public.orders),
    'delivered_orders', (select count(*) from public.orders where status = 'delivered'),
    'processing_orders', (select count(*) from public.orders where status = 'processing'),
    'cancelled_orders', (select count(*) from public.orders where status = 'cancelled'),
    'total_revenue', coalesce((select sum(total) from public.orders where status = 'delivered'), 0),
    'revenue_by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', to_char(day, 'Dy'), 'revenue', revenue) order by day)
      from (
        select date_trunc('day', created_at) as day, sum(total) as revenue
        from public.orders
        where created_at >= now() - interval '7 days' and status <> 'cancelled'
        group by 1
      ) d
    ), '[]'::jsonb),
    'order_status_data', (
      select jsonb_agg(jsonb_build_object('name', status, 'value', count, 'color',
        case status
          when 'delivered' then '#10b981'
          when 'processing' then '#f59e0b'
          when 'cancelled' then '#ef4444'
          else '#94a3b8'
        end
      ))
      from (select status::text, count(*)::int from public.orders group by status) s
    ),
    'best_selling_products', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select product_id, product_name as name, sum(quantity)::int as quantity_sold
        from public.order_items
        group by product_id, product_name
        order by quantity_sold desc
        limit 5
      ) x
    ), '[]'::jsonb),
    'recent_activity', coalesce((
      select jsonb_agg(row_to_json(x))
      from (
        select id, customer_name, total, created_at
        from public.orders
        order by created_at desc
        limit 5
      ) x
    ), '[]'::jsonb)
  ) else '{}'::jsonb end;
$$;

grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_media enable row level security;
alter table public.product_inventory enable row level security;
alter table public.delivery_fees enable row level security;
alter table public.hero_banners enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin" on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

drop policy if exists "public read visible categories" on public.categories;
create policy "public read visible categories" on public.categories for select using (visible = true or public.is_admin());
drop policy if exists "admin manage categories" on public.categories;
create policy "admin manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products for select using (status = 'active' or public.is_admin());
drop policy if exists "admin manage products" on public.products;
create policy "admin manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read product colors" on public.product_colors;
create policy "public read product colors" on public.product_colors for select using (exists (select 1 from public.products p where p.id = product_id and (p.status = 'active' or public.is_admin())));
drop policy if exists "admin manage product colors" on public.product_colors;
create policy "admin manage product colors" on public.product_colors for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read product media" on public.product_media;
create policy "public read product media" on public.product_media for select using (true);
drop policy if exists "admin manage product media" on public.product_media;
create policy "admin manage product media" on public.product_media for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read inventory" on public.product_inventory;
create policy "public read inventory" on public.product_inventory for select using (true);
drop policy if exists "admin manage inventory" on public.product_inventory;
create policy "admin manage inventory" on public.product_inventory for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read delivery fees" on public.delivery_fees;
create policy "public read delivery fees" on public.delivery_fees for select using (true);
drop policy if exists "admin manage delivery fees" on public.delivery_fees;
create policy "admin manage delivery fees" on public.delivery_fees for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read visible banners" on public.hero_banners;
create policy "public read visible banners" on public.hero_banners for select using (visible = true or public.is_admin());
drop policy if exists "admin manage banners" on public.hero_banners;
create policy "admin manage banners" on public.hero_banners for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users read own orders or admin" on public.orders;
create policy "users read own orders or admin" on public.orders for select using (public.is_admin() or auth.uid() = user_id or (auth.uid() is not null and customer_email = (select email from auth.users where id = auth.uid())));
drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users read own order items or admin" on public.order_items;
create policy "users read own order items or admin" on public.order_items for select using (public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "users manage own push subscriptions" on public.push_subscriptions;
create policy "users manage own push subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.delivery_fees (name, price) values
  ('West Bank', 25),
  ('Jerusalem', 30),
  ('الداخل المحتل', 40)
on conflict (name) do nothing;

insert into public.categories (name, name_en, visible, sort_order) values
  ('فساتين مناسبات', 'Occasion Dresses', true, 1),
  ('فساتين عملية', 'Casual Dresses', true, 2),
  ('عبايات', 'Abayas', true, 3),
  ('أطقم', 'Sets', true, 4),
  ('ملابس أطفال', 'Kids Wear', true, 5)
on conflict do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-media', 'product-media', true, 104857600, array['image/jpeg','image/png','image/webp','video/mp4','video/webm']),
  ('category-media', 'category-media', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('banner-media', 'banner-media', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read ecommerce media" on storage.objects;
create policy "public read ecommerce media" on storage.objects for select using (bucket_id in ('product-media', 'category-media', 'banner-media'));
drop policy if exists "admin upload ecommerce media" on storage.objects;
create policy "admin upload ecommerce media" on storage.objects for insert with check (bucket_id in ('product-media', 'category-media', 'banner-media') and public.is_admin());
drop policy if exists "admin update ecommerce media" on storage.objects;
create policy "admin update ecommerce media" on storage.objects for update using (bucket_id in ('product-media', 'category-media', 'banner-media') and public.is_admin()) with check (bucket_id in ('product-media', 'category-media', 'banner-media') and public.is_admin());
drop policy if exists "admin delete ecommerce media" on storage.objects;
create policy "admin delete ecommerce media" on storage.objects for delete using (bucket_id in ('product-media', 'category-media', 'banner-media') and public.is_admin());
