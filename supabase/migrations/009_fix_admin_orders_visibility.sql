create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt()->>'email', '')) = 'hassahfayg@gmail.com'
    or exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and (role = 'admin' or lower(email) = 'hassahfayg@gmail.com')
    );
$$;

insert into public.profiles (id, email, full_name, role)
select id, email, coalesce(raw_user_meta_data->>'full_name', email), 'admin'::public.user_role
from auth.users
where lower(email) = 'hassahfayg@gmail.com'
on conflict (id) do update set
  email = excluded.email,
  role = 'admin'::public.user_role;

update public.profiles
set role = 'admin'
where lower(email) = 'hassahfayg@gmail.com';

create or replace function public.admin_orders_with_items()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_admin() then coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'user_id', o.user_id,
        'customer_name', o.customer_name,
        'customer_email', o.customer_email,
        'customer_phone', o.customer_phone,
        'region', o.region,
        'city', o.city,
        'village', o.village,
        'address', o.address,
        'subtotal', o.subtotal,
        'delivery_fee', o.delivery_fee,
        'total', o.total,
        'status', o.status,
        'payment_status', o.payment_status,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'order_items', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', oi.id,
              'order_id', oi.order_id,
              'product_id', oi.product_id,
              'color_id', oi.color_id,
              'product_name', oi.product_name,
              'product_image', oi.product_image,
              'color_name', oi.color_name,
              'size', oi.size,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total', oi.total
            )
            order by oi.id
          )
          from public.order_items oi
          where oi.order_id = o.id
        ), '[]'::jsonb)
      )
      order by o.created_at desc
    ),
    '[]'::jsonb
  ) else '[]'::jsonb end
  from public.orders o;
$$;

grant execute on function public.admin_orders_with_items() to authenticated;

drop policy if exists "users read own orders or admin" on public.orders;
create policy "users read own orders or admin" on public.orders
for select using (
  public.is_admin()
  or auth.uid() = user_id
  or (
    auth.uid() is not null
    and customer_email = (select email from auth.users where id = auth.uid())
  )
);

drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders" on public.orders
for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users read own order items or admin" on public.order_items;
create policy "users read own order items or admin" on public.order_items
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.user_id = auth.uid()
        or (
          auth.uid() is not null
          and o.customer_email = (select email from auth.users where id = auth.uid())
        )
      )
  )
);

create or replace function public.notify_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, title, body, type, data)
    select id,
      'طلب جديد',
      'طلب جديد من ' || new.customer_name || ' بقيمة ' || new.total || ' شيكل',
      'new_order',
      jsonb_build_object('order_id', new.id)
    from public.profiles
    where role = 'admin' or lower(email) = 'hassahfayg@gmail.com';
  elsif old.status is distinct from new.status then
    if new.status = 'cancelled' then
      insert into public.notifications (user_id, title, body, type, data)
      select id, 'تم إلغاء طلب', 'تم إلغاء الطلب #' || new.id, 'order_cancelled', jsonb_build_object('order_id', new.id)
      from public.profiles
      where role = 'admin' or lower(email) = 'hassahfayg@gmail.com';
    end if;

    if new.user_id is not null then
      insert into public.notifications (user_id, title, body, type, data)
      values (new.user_id, 'تحديث حالة الطلب', 'حالة طلبك أصبحت: ' || new.status, 'order_status', jsonb_build_object('order_id', new.id, 'status', new.status));
    end if;
  end if;
  return new;
end;
$$;
