create or replace function public.protect_profile_role_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    if new.id is distinct from old.id
      or new.email is distinct from old.email
      or new.role is distinct from old.role
    then
      raise exception 'Only administrators can change profile identity or role';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role_fields_trigger on public.profiles;
create trigger protect_profile_role_fields_trigger
before update on public.profiles
for each row execute function public.protect_profile_role_fields();

drop policy if exists "public read product media" on public.product_media;
create policy "public read product media" on public.product_media
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.product_colors c
    join public.products p on p.id = c.product_id
    where c.id = product_media.color_id
      and p.status = 'active'
  )
);

drop policy if exists "public read inventory" on public.product_inventory;
create policy "public read inventory" on public.product_inventory
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.product_colors c
    join public.products p on p.id = c.product_id
    where c.id = product_inventory.color_id
      and p.status = 'active'
  )
);

create or replace function public.place_order(order_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  order_id uuid;
  item jsonb;
  product_row public.products%rowtype;
  color_row public.product_colors%rowtype;
  inventory_row public.product_inventory%rowtype;
  current_user_id uuid := auth.uid();
  calculated_subtotal numeric(12,2) := 0;
  calculated_delivery_fee numeric(12,2) := 0;
  order_region text := order_payload->>'region';
  item_quantity integer;
  item_image text;
begin
  if jsonb_typeof(order_payload->'items') is distinct from 'array'
    or jsonb_array_length(order_payload->'items') = 0
  then
    raise exception 'Order must include at least one item';
  end if;

  order_region := case
    when order_region = 'West Bank' then 'الضفة الغربية'
    when order_region = 'Jerusalem' then 'القدس'
    else order_region
  end;

  select price into calculated_delivery_fee
  from public.delivery_fees
  where name = order_region
  limit 1;

  calculated_delivery_fee := coalesce(calculated_delivery_fee, 0);

  insert into public.orders (
    user_id, customer_name, customer_email, customer_phone, region, city, village,
    address, subtotal, delivery_fee, total
  )
  values (
    current_user_id,
    order_payload->>'customer_name',
    nullif(order_payload->>'customer_email', ''),
    order_payload->>'customer_phone',
    order_region,
    order_payload->>'city',
    nullif(order_payload->>'village', ''),
    order_payload->>'address',
    0,
    calculated_delivery_fee,
    calculated_delivery_fee
  )
  returning id into order_id;

  for item in select * from jsonb_array_elements(order_payload->'items') loop
    item_quantity := (item->>'quantity')::integer;
    if item_quantity <= 0 then
      raise exception 'Item quantity must be greater than zero';
    end if;

    select * into product_row
    from public.products
    where id = (item->>'productId')::uuid
      and status = 'active'
    limit 1;

    if product_row.id is null then
      raise exception 'Product not available %', item->>'productId';
    end if;

    select * into color_row
    from public.product_colors
    where product_id = product_row.id
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

    if inventory_row.id is null or inventory_row.quantity < item_quantity then
      raise exception 'Insufficient stock for % / %', color_row.name, item->>'size';
    end if;

    select path into item_image
    from public.product_media
    where color_id = color_row.id
      and media_type = 'image'
    order by sort_order, created_at
    limit 1;

    update public.product_inventory
    set quantity = quantity - item_quantity
    where id = inventory_row.id;

    insert into public.order_items (
      order_id, product_id, color_id, product_name, product_image,
      color_name, size, quantity, unit_price
    )
    values (
      order_id,
      product_row.id,
      color_row.id,
      product_row.name,
      coalesce(item_image, item->>'productImage'),
      color_row.name,
      item->>'size',
      item_quantity,
      product_row.price
    );

    calculated_subtotal := calculated_subtotal + (product_row.price * item_quantity);
  end loop;

  update public.orders
  set subtotal = calculated_subtotal,
      total = calculated_subtotal + calculated_delivery_fee
  where id = order_id;

  return order_id;
end;
$$;

grant execute on function public.place_order(jsonb) to anon, authenticated;
