create or replace function public.refresh_inventory_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_color uuid;
  target_product uuid;
  target_product_name text;
  target_color_name text;
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
  returning product_id, name into target_product, target_color_name;

  select name into target_product_name
  from public.products
  where id = target_product;

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
  select pr.id,
    'نفدت كمية منتج',
    'نفدت كمية ' || coalesce(target_product_name, 'منتج') || ' - ' || coalesce(target_color_name, ''),
    'stock_out',
    jsonb_build_object('product_id', target_product, 'color_id', target_color)
  from public.profiles pr
  where pr.role = 'admin'
    and not exists (
      select 1 from public.product_inventory i
      where i.color_id = target_color and i.quantity > 0
    )
    and not exists (
      select 1 from public.notifications n
      where n.type = 'stock_out'
        and n.data->>'color_id' = target_color::text
        and n.created_at > now() - interval '1 hour'
    );

  return coalesce(new, old);
end;
$$;

drop trigger if exists product_inventory_status_trigger on public.product_inventory;
create trigger product_inventory_status_trigger
after insert or update of quantity on public.product_inventory
for each row execute function public.refresh_inventory_status();

drop policy if exists "users read own order items or admin" on public.order_items;
create policy "users read own order items or admin" on public.order_items
for select using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
  or exists (
    select 1 from public.orders o
    where o.id = order_id
      and auth.uid() is not null
      and o.customer_email = (select email from auth.users where id = auth.uid())
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
