export const ADMIN_EMAIL = 'hassahfayg@gmail.com';

export const palestinianCities: Record<string, string[]> = {
  'West Bank': [
    'Ramallah',
    'Hebron',
    'Bethlehem',
    'Nablus',
    'Jenin',
    'Tulkarm',
    'Qalqilya',
    'Salfit',
    'Jericho',
    'Tubas',
  ],
  Jerusalem: ['Jerusalem', 'Abu Dis', 'Al-Eizariya', 'Beit Hanina', 'Shuafat'],
  'الداخل المحتل': [
    'Haifa',
    'Nazareth',
    'Acre',
    'Jaffa',
    'Lod',
    'Ramle',
    'Umm al-Fahm',
    'Tayibe',
    'Baqa al-Gharbiyye',
    'Kafr Qasim',
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
