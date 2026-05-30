import { isSupabaseConfigured, publicStorageUrl, supabase } from '../../lib/supabaseClient';
import type {
  Category,
  DeliveryRegion,
  HeroBanner,
  NotificationItem,
  Order,
  OrderStatus,
  Product,
  ProductColor,
  StoreSettings,
  Profile,
} from './types';

const PRODUCT_BUCKET = 'product-media';
const CATEGORY_BUCKET = 'category-media';
const BANNER_BUCKET = 'banner-media';

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en || '',
    description: row.description || '',
    image: publicStorageUrl(CATEGORY_BUCKET, row.image_path),
    order: row.sort_order ?? 0,
    visible: row.visible,
  };
}

function mapProduct(row: any): Product {
  const colors: ProductColor[] = (row.product_colors || []).map((color: any) => {
    const media = color.product_media || [];
    const sizes = (color.product_inventory || []).map((item: any) => ({
      size: item.size,
      quantity: item.quantity,
      available: item.available,
    }));
    return {
      id: color.id,
      name: color.name,
      hex: color.hex,
      soldOut: color.sold_out,
      images: media.filter((m: any) => m.media_type === 'image').map((m: any) => publicStorageUrl(PRODUCT_BUCKET, m.path)),
      videos: media.filter((m: any) => m.media_type === 'video').map((m: any) => publicStorageUrl(PRODUCT_BUCKET, m.path)),
      sizes,
    };
  });
  const firstImages = colors.flatMap((color) => color.images);
  const allSizes = colors.flatMap((color) => color.sizes || []);

  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en || '',
    description: row.description || '',
    category: row.category_id,
    categoryName: row.categories?.name || '',
    price: Number(row.price || 0),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    discount: row.discount ? Number(row.discount) : 0,
    images: firstImages,
    videos: colors.flatMap((color) => color.videos || []),
    colors,
    sizes: allSizes,
    sku: row.sku || '',
    tags: row.tags || [],
    status: row.status,
    featured: row.featured,
    bestseller: row.bestseller,
    createdAt: row.created_at,
  };
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email || '',
    customerPhone: row.customer_phone,
    region: row.region,
    city: row.city,
    village: row.village || '',
    address: row.address,
    products: (row.order_items || []).map((item: any) => ({
      productId: item.product_id,
      productName: item.product_name,
      productImage: publicStorageUrl(PRODUCT_BUCKET, item.product_image),
      color: item.color_name,
      size: item.size,
      quantity: item.quantity,
      price: Number(item.unit_price),
    })),
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchCategories(includeHidden = false) {
  if (!isSupabaseConfigured) return [];
  let query = supabase.from('categories').select('*').order('sort_order');
  if (!includeHidden) query = query.eq('visible', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapCategory);
}

export async function saveCategory(payload: Partial<Category>, file?: File) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  let imagePath = payload.image || '';
  if (file) imagePath = await uploadMedia(CATEGORY_BUCKET, file, 'categories');
  const body = {
    name: payload.name,
    name_en: payload.nameEn,
    description: payload.description,
    image_path: imagePath,
    visible: payload.visible ?? true,
    sort_order: payload.order ?? 999,
  };
  const request = payload.id
    ? supabase.from('categories').update(body).eq('id', payload.id).select().single()
    : supabase.from('categories').insert(body).select().single();
  const { data, error } = await request;
  if (error) throw error;
  return mapCategory(data);
}

export async function deleteCategory(id: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchProducts(filters?: { categoryId?: string; includeInactive?: boolean }) {
  if (!isSupabaseConfigured) return [];
  let query = supabase
    .from('products')
    .select('*, categories(name), product_colors(*, product_media(*), product_inventory(*))')
    .order('created_at', { ascending: false });
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
  if (!filters?.includeInactive) query = query.eq('status', 'active');
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function fetchProduct(id: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), product_colors(*, product_media(*), product_inventory(*))')
    .eq('id', id)
    .single();
  if (error) throw error;
  return mapProduct(data);
}

export async function saveProduct(product: Partial<Product>) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const body = {
    category_id: product.category,
    name: product.name,
    name_en: product.nameEn,
    description: product.description,
    price: product.price,
    original_price: product.originalPrice || null,
    discount: product.discount || 0,
    sku: product.sku,
    tags: product.tags || [],
    status: product.status || 'active',
    featured: product.featured || false,
    bestseller: product.bestseller || false,
  };
  const request = product.id
    ? supabase.from('products').update(body).eq('id', product.id).select().single()
    : supabase.from('products').insert(body).select().single();
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function saveProductWithInventory(product: Partial<Product>) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const savedProduct = await saveProduct(product);

  if (product.colors) {
    if (product.id) {
      const { error: deleteError } = await supabase
        .from('product_colors')
        .delete()
        .eq('product_id', product.id);
      if (deleteError) throw deleteError;
    }

    for (let colorIndex = 0; colorIndex < product.colors.length; colorIndex += 1) {
      const color: any = product.colors[colorIndex];
      const { data: colorRow, error: colorError } = await supabase
        .from('product_colors')
        .insert({
          product_id: savedProduct.id,
          name: color.name,
          hex: color.hex || '#000000',
          sort_order: colorIndex + 1,
        })
        .select()
        .single();
      if (colorError) throw colorError;

      const inventoryRows = (color.sizes || [])
        .filter((size: any) => size.size)
        .map((size: any) => ({
          color_id: colorRow.id,
          size: size.size,
          quantity: Number(size.quantity || 0),
          available: Number(size.quantity || 0) > 0,
        }));

      if (inventoryRows.length > 0) {
        const { error: inventoryError } = await supabase.from('product_inventory').insert(inventoryRows);
        if (inventoryError) throw inventoryError;
      }

      const mediaRows: any[] = [];
      const existingImages = (color.images || []).filter((path: string) => path && !path.startsWith('blob:'));
      const existingVideos = (color.videos || []).filter((path: string) => path && !path.startsWith('blob:'));

      for (const image of existingImages) {
        mediaRows.push({ color_id: colorRow.id, media_type: 'image', path: storagePathFromPublicUrl(PRODUCT_BUCKET, image), sort_order: mediaRows.length + 1 });
      }
      for (const video of existingVideos) {
        mediaRows.push({ color_id: colorRow.id, media_type: 'video', path: storagePathFromPublicUrl(PRODUCT_BUCKET, video), sort_order: mediaRows.length + 1 });
      }

      for (const file of color.imageFiles || []) {
        const path = await uploadMedia(PRODUCT_BUCKET, file, `products/${savedProduct.id}/${colorRow.id}`);
        mediaRows.push({ color_id: colorRow.id, media_type: 'image', path, sort_order: mediaRows.length + 1 });
      }
      for (const file of color.videoFiles || []) {
        const path = await uploadMedia(PRODUCT_BUCKET, file, `products/${savedProduct.id}/${colorRow.id}`);
        mediaRows.push({ color_id: colorRow.id, media_type: 'video', path, sort_order: mediaRows.length + 1 });
      }

      if (mediaRows.length > 0) {
        const { error: mediaError } = await supabase.from('product_media').insert(mediaRows);
        if (mediaError) throw mediaError;
      }
    }
  }

  return savedProduct;
}

export async function deleteProduct(id: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadProductColorMedia(colorId: string, files: File[]) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const rows = [];
  for (const file of files) {
    const path = await uploadMedia(PRODUCT_BUCKET, file, `products/${colorId}`);
    rows.push({
      color_id: colorId,
      media_type: file.type.startsWith('video') ? 'video' : 'image',
      path,
      sort_order: rows.length + 1,
    });
  }
  const { error } = await supabase.from('product_media').insert(rows);
  if (error) throw error;
}

export async function fetchBanners() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('hero_banners').select('*').eq('visible', true).order('sort_order');
  if (error) throw error;
  return (data || []).map((row: any): HeroBanner => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    image: publicStorageUrl(BANNER_BUCKET, row.image_path),
    order: row.sort_order,
    visible: row.visible,
  }));
}

export async function fetchAdminBanners() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('hero_banners').select('*').order('sort_order');
  if (error) throw error;
  return (data || []).map((row: any): HeroBanner => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    image: publicStorageUrl(BANNER_BUCKET, row.image_path),
    order: row.sort_order,
    visible: row.visible,
  }));
}

export async function saveBanner(payload: Partial<HeroBanner>, file?: File) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  let imagePath = payload.image ? storagePathFromPublicUrl(BANNER_BUCKET, payload.image) : '';
  if (file) imagePath = await uploadMedia(BANNER_BUCKET, file, 'banners');

  const body = {
    title: payload.title,
    subtitle: payload.subtitle || '',
    image_path: imagePath,
    visible: payload.visible ?? true,
    sort_order: payload.order ?? 999,
  };
  const request = payload.id
    ? supabase.from('hero_banners').update(body).eq('id', payload.id).select().single()
    : supabase.from('hero_banners').insert(body).select().single();
  const { data, error } = await request;
  if (error) throw error;
  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle || '',
    image: publicStorageUrl(BANNER_BUCKET, data.image_path),
    order: data.sort_order,
    visible: data.visible,
  } as HeroBanner;
}

export async function deleteBanner(id: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('hero_banners').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchDeliveryRegions() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('delivery_fees').select('*').order('name');
  if (error) throw error;
  const preferredOrder = ['الضفة الغربية', 'القدس', 'الداخل المحتل'];
  const normalized = new Map<string, DeliveryRegion>();

  for (const row of data || []) {
    const name = normalizeDeliveryRegionName(row.name);
    if (!preferredOrder.includes(name)) continue;
    if (!normalized.has(name)) {
      normalized.set(name, { id: row.id, name, price: Number(row.price) });
    }
  }

  return preferredOrder
    .map((name) => normalized.get(name))
    .filter(Boolean) as DeliveryRegion[];
}

function normalizeDeliveryRegionName(name: string) {
  const value = String(name || '').trim();
  if (value === 'West Bank') return 'الضفة الغربية';
  if (value === 'Jerusalem') return 'القدس';
  return value;
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const envSettings = {
    whatsappUrl: import.meta.env.VITE_WHATSAPP_URL || '',
    instagramUrl: import.meta.env.VITE_INSTAGRAM_URL || '',
    facebookUrl: import.meta.env.VITE_FACEBOOK_URL || '',
  };

  if (!isSupabaseConfigured) {
    return envSettings;
  }

  const { data, error } = await supabase.from('store_settings').select('key,value');
  if (error) {
    console.warn('[Settings] Could not load store_settings:', error.message);
    return envSettings;
  }

  const settings = Object.fromEntries((data || []).map((row: any) => [row.key, row.value || '']));
  return {
    whatsappUrl: settings.whatsapp_url || envSettings.whatsappUrl,
    instagramUrl: settings.instagram_url || envSettings.instagramUrl,
    facebookUrl: settings.facebook_url || envSettings.facebookUrl,
  };
}

export async function saveStoreSettings(settings: StoreSettings) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('store_settings').upsert([
    { key: 'whatsapp_url', value: settings.whatsappUrl },
    { key: 'instagram_url', value: settings.instagramUrl },
    { key: 'facebook_url', value: settings.facebookUrl },
  ]);
  if (error) throw error;
}

export async function saveDeliveryFee(id: string, price: number) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('delivery_fees').update({ price }).eq('id', id);
  if (error) throw error;
}

export async function createOrder(payload: {
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  region: string;
  city: string;
  village?: string;
  address: string;
  deliveryFee: number;
  items: Array<{
    productId: string;
    productName: string;
    productImage: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
  }>;
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { data, error } = await supabase.rpc('place_order', {
    order_payload: {
      customer_name: payload.customerName,
      customer_email: payload.customerEmail || null,
      customer_phone: payload.customerPhone,
      region: payload.region,
      city: payload.city,
      village: payload.village || null,
      address: payload.address,
      subtotal,
      delivery_fee: payload.deliveryFee,
      total: subtotal + payload.deliveryFee,
      items: payload.items,
    },
  });
  if (error) throw error;
  return data as string;
}

export async function fetchOrders(ownOnly = false, adminView = false) {
  if (!isSupabaseConfigured) return [];
  if (adminView) {
    const { data, error } = await supabase.rpc('admin_orders_with_items');
    if (!error && Array.isArray(data)) return data.map(mapOrder);
    if (error) console.warn('[Orders] admin_orders_with_items failed, falling back to table query:', error.message);
  }

  const user = (await supabase.auth.getUser()).data.user;
  let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
  if (ownOnly && user) {
    const conditions = [`user_id.eq.${user.id}`];
    if (user.email) conditions.push(`customer_email.eq.${user.email}`);
    query = query.or(conditions.join(','));
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function fetchAdminStats() {
  if (!isSupabaseConfigured) return {};
  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  if (error) throw error;
  return data;
}

export async function fetchNotifications() {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map((row: any): NotificationItem => ({
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    data: row.data || {},
    read: row.read,
    createdAt: row.created_at,
  }));
}

export async function markNotificationRead(id: string) {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function updateProfile(profile: Pick<Profile, 'id' | 'fullName' | 'phone' | 'region' | 'city' | 'town'>) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: profile.fullName,
      phone: profile.phone,
      region: profile.region,
      city: profile.city,
      town: profile.town,
    })
    .eq('id', profile.id);
  if (error) throw error;

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: profile.fullName,
      phone: profile.phone,
      region: profile.region,
      city: profile.city,
      town: profile.town,
    },
  });
  if (authError) throw authError;
}

export async function savePushSubscription(subscription: PushSubscription) {
  if (!isSupabaseConfigured) return;
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Login required for push notifications');
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    subscription: subscription.toJSON(),
  });
  if (error) throw error;
}

export async function uploadMedia(bucket: string, file: File, folder: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

function storagePathFromPublicUrl(bucket: string, value: string) {
  if (!value.startsWith('http')) return value.replace(new RegExp(`^${bucket}/`), '');
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = value.indexOf(marker);
  if (index === -1) return value;
  return decodeURIComponent(value.slice(index + marker.length));
}
