drop policy if exists "users read own orders or admin" on public.orders;
create policy "users read own orders or admin" on public.orders
for select using (
  public.is_admin()
  or auth.uid() = user_id
  or (
    auth.uid() is not null
    and customer_email = (auth.jwt()->>'email')
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
          and o.customer_email = (auth.jwt()->>'email')
        )
      )
  )
);

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
