export const ADMIN_EMAIL = 'hassahfayg@gmail.com';

export const palestinianCities: Record<string, string[]> = {
  'الضفة الغربية': [
    'رام الله',
    'الخليل',
    'بيت لحم',
    'نابلس',
    'جنين',
    'طولكرم',
    'قلقيلية',
    'سلفيت',
    'أريحا',
    'طوباس',
  ],
  'القدس': ['القدس', 'أبو ديس', 'العيزرية', 'بيت حنينا', 'شعفاط'],
  'الداخل المحتل': [
    'حيفا',
    'الناصرة',
    'عكا',
    'يافا',
    'اللد',
    'الرملة',
    'أم الفحم',
    'الطيبة',
    'باقة الغربية',
    'كفر قاسم',
  ],
};

export const orderStatuses = [
  'pending',
  'processing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export const defaultProductStatuses = ['active', 'draft', 'hidden', 'sold_out'] as const;
