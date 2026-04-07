export const COLORS = {
  primary: '#1a1a2e',
  primaryLight: '#16213e',
  primaryDark: '#0f0f1a',
  accent: '#e94560',
  accentLight: '#ff6b81',
  accentDark: '#c73450',
  gold: '#f5a623',
  goldLight: '#ffc857',
  goldDark: '#d4891a',
  surface: '#f8f9fa',
  surfaceDark: '#e9ecef',
  white: '#ffffff',
  black: '#000000',
  textPrimary: '#1a1a2e',
  textSecondary: '#6c757d',
  textInverse: '#ffffff',
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
  border: '#dee2e6',
  skeleton: '#e9ecef',
} as const;

export const FONTS = {
  regular: 'Cairo-Regular',
  bold: 'Cairo-Bold',
  semiBold: 'Cairo-SemiBold',
  medium: 'Cairo-Medium',
  light: 'Cairo-Light',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export const CAR_CATEGORIES = [
  { id: 'engine_parts', nameAr: 'قطع المحرك', nameEn: 'Engine Parts', icon: '⚙️' },
  { id: 'brake_system', nameAr: 'نظام الفرامل', nameEn: 'Brake System', icon: '🛑' },
  { id: 'electrical', nameAr: 'كهرباء', nameEn: 'Electrical', icon: '⚡' },
  { id: 'body_parts', nameAr: 'قطع الهيكل', nameEn: 'Body Parts', icon: '🚗' },
  { id: 'filters', nameAr: 'فلاتر', nameEn: 'Filters', icon: '🔧' },
  { id: 'suspension', nameAr: 'نظام التعليق', nameEn: 'Suspension', icon: '🔩' },
  { id: 'cooling', nameAr: 'نظام التبريد', nameEn: 'Cooling', icon: '❄️' },
  { id: 'transmission', nameAr: 'ناقل الحركة', nameEn: 'Transmission', icon: '⚙️' },
] as const;

export const EGYPTIAN_GOVERNORATES = [
  { en: 'Cairo', ar: 'القاهرة' },
  { en: 'Giza', ar: 'الجيزة' },
  { en: 'Alexandria', ar: 'الإسكندرية' },
  { en: 'Dakahlia', ar: 'الدقهلية' },
  { en: 'Sharqia', ar: 'الشرقية' },
  { en: 'Qalyubia', ar: 'القليوبية' },
  { en: 'Beheira', ar: 'البحيرة' },
  { en: 'Minya', ar: 'المنيا' },
  { en: 'Gharbia', ar: 'الغربية' },
  { en: 'Fayoum', ar: 'الفيوم' },
  { en: 'Sohag', ar: 'سوهاج' },
  { en: 'Asyut', ar: 'أسيوط' },
  { en: 'Menoufia', ar: 'المنوفية' },
  { en: 'Beni Suef', ar: 'بني سويف' },
  { en: 'Kafr El Sheikh', ar: 'كفر الشيخ' },
  { en: 'Qena', ar: 'قنا' },
  { en: 'Aswan', ar: 'أسوان' },
  { en: 'Damietta', ar: 'دمياط' },
  { en: 'Ismailia', ar: 'الإسماعيلية' },
  { en: 'Luxor', ar: 'الأقصر' },
  { en: 'Port Said', ar: 'بورسعيد' },
  { en: 'Suez', ar: 'السويس' },
  { en: 'Red Sea', ar: 'البحر الأحمر' },
  { en: 'Matrouh', ar: 'مطروح' },
  { en: 'North Sinai', ar: 'شمال سيناء' },
  { en: 'South Sinai', ar: 'جنوب سيناء' },
  { en: 'New Valley', ar: 'الوادي الجديد' },
] as const;
