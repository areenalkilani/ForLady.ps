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
          select jsonb_agg(row_to_json(oi) order by oi.id)
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

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (role = 'admin' or lower(email) = 'hassahfayg@gmail.com')
  );
$$;

update public.profiles
set role = 'admin'
where lower(email) = 'hassahfayg@gmail.com';
