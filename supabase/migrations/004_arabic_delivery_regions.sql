insert into public.delivery_fees (name, price)
values (
  'الضفة الغربية',
  coalesce((select price from public.delivery_fees where name in ('الضفة الغربية', 'West Bank') limit 1), 25)
)
on conflict (name) do update set price = excluded.price;

insert into public.delivery_fees (name, price)
values (
  'القدس',
  coalesce((select price from public.delivery_fees where name in ('القدس', 'Jerusalem') limit 1), 30)
)
on conflict (name) do update set price = excluded.price;

insert into public.delivery_fees (name, price)
values ('الداخل المحتل', 40)
on conflict (name) do nothing;

delete from public.delivery_fees where name in ('West Bank', 'Jerusalem');
