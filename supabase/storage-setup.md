# Supabase Storage Setup

The migration creates these public buckets and RLS policies:

- `product-media`: product color images/videos
- `category-media`: category images
- `banner-media`: homepage banners

Admins can upload/update/delete. Everyone can read public media.

Recommended folders:

- `products/{color_id}/...`
- `categories/...`
- `banners/...`
