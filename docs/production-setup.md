# Production Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_production_ecommerce.sql` in the Supabase SQL editor or via Supabase CLI.
3. Create the admin auth user with email `hassahfayg@gmail.com`. The database trigger gives this account the `admin` role automatically.
4. Configure Supabase Auth email delivery with Resend SMTP:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your `RESEND_API_KEY`
   - Sender: `RESEND_FROM_EMAIL`
5. Add the Vite env values from `.env.example`.
6. Deploy Edge Functions:
   - `supabase functions deploy send-email`
   - `supabase functions deploy send-push`
7. Upload real product/category/banner media from the admin UI or Supabase Storage.
8. Add product colors, media, and per-size inventory in `product_colors`, `product_media`, and `product_inventory`.

Verification checklist:

- Register a customer and verify the email.
- Login/logout with Supabase Auth.
- Use forgot password and confirm the reset link opens `/reset-password`.
- Create products/categories/orders against Supabase tables.
- Place a guest checkout without email.
- Confirm inventory decrements per color and size.
- Confirm product/color/status changes when inventory reaches zero.
- Confirm admin notifications appear for new orders, cancellations, and low stock.
- Confirm customer notifications appear when order status changes.
