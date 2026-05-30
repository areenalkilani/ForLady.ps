insert into public.delivery_fees (name, price)
values
  ('الضفة الغربية', 25),
  ('القدس', 30),
  ('الداخل المحتل', 40)
on conflict (name) do nothing;

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
  calculated_subtotal numeric(12,2) := 0;
  calculated_delivery_fee numeric(12,2) := 0;
begin
  for item in select * from jsonb_array_elements(order_payload->'items') loop
    calculated_subtotal := calculated_subtotal + ((item->>'price')::numeric * (item->>'quantity')::integer);
  end loop;

  select price into calculated_delivery_fee
  from public.delivery_fees
  where name = order_payload->>'region'
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
    order_payload->>'region',
    order_payload->>'city',
    nullif(order_payload->>'village', ''),
    order_payload->>'address',
    calculated_subtotal,
    calculated_delivery_fee,
    calculated_subtotal + calculated_delivery_fee
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

grant execute on function public.place_order(jsonb) to anon, authenticated;
