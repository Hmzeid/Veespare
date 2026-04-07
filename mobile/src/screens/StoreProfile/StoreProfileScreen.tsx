import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '@/constants/theme';

// ── Navigation types ────────────────────────────────────────────────
export type StoreProfileStackParamList = {
  StoreProfile: { storeId: string };
  ProductDetail: { productId: string };
};

type Props = NativeStackScreenProps<StoreProfileStackParamList, 'StoreProfile'>;

// ── Types ───────────────────────────────────────────────────────────
type TabKey = 'products' | 'reviews' | 'info';

interface StoreProduct {
  id: string;
  nameAr: string;
  price: number;
  condition: string;
  rating: number;
}

interface Review {
  id: string;
  userNameAr: string;
  rating: number;
  commentAr: string;
  date: string;
}

// ── Mock data ───────────────────────────────────────────────────────
const MOCK_STORE = {
  id: 's1',
  nameAr: 'قطع غيار النيل',
  verified: true,
  rating: 4.5,
  reviewCount: 128,
  coverImage: null,
  logoImage: null,
  descriptionAr: 'متجر متخصص في قطع غيار السيارات الأصلية والبديلة منذ أكثر من 15 عام',
  phone: '+201234567890',
  whatsapp: '+201234567890',
  email: 'info@nilparts.com',
  locationAr: 'شارع أحمد عرابي، المهندسين، الجيزة',
  coordinates: { lat: 30.0444, lng: 31.2357 },
  workingHours: {
    weekdaysAr: 'السبت - الخميس: 9 ص - 10 م',
    fridayAr: 'الجمعة: 2 م - 10 م',
  },
  deliveryZones: ['القاهرة', 'الجيزة', 'القليوبية', 'الإسكندرية'],
};

const MOCK_PRODUCTS: StoreProduct[] = [
  { id: '1', nameAr: 'فلتر زيت تويوتا', price: 250, condition: 'جديد', rating: 4.5 },
  { id: '2', nameAr: 'تيل فرامل هيونداي', price: 480, condition: 'جديد', rating: 4.8 },
  { id: '3', nameAr: 'دينامو كيا سيراتو', price: 3500, condition: 'مجدد', rating: 4.1 },
  { id: '4', nameAr: 'مساعدين نيسان صني', price: 1200, condition: 'مستعمل', rating: 3.9 },
  { id: '5', nameAr: 'بطارية فارتا 70 أمبير', price: 2800, condition: 'جديد', rating: 4.3 },
  { id: '6', nameAr: 'رديتر مياه شيفروليه', price: 1800, condition: 'جديد', rating: 4.6 },
];

const MOCK_REVIEWS: Review[] = [
  { id: '1', userNameAr: 'أحمد محمد', rating: 5, commentAr: 'متجر ممتاز والقطع أصلية 100%', date: '2024-01-15' },
  { id: '2', userNameAr: 'محمود علي', rating: 4, commentAr: 'أسعار معقولة والتوصيل سريع', date: '2024-01-10' },
  { id: '3', userNameAr: 'خالد إبراهيم', rating: 5, commentAr: 'خدمة عملاء رائعة وسرعة في الرد', date: '2024-01-05' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS: { key: TabKey; labelAr: string }[] = [
  { key: 'products', labelAr: 'المنتجات' },
  { key: 'reviews', labelAr: 'التقييمات' },
  { key: 'info', labelAr: 'معلومات' },
];

// ── Component ───────────────────────────────────────────────────────
export default function StoreProfileScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { storeId } = route.params;
  const [activeTab, setActiveTab] = useState<TabKey>('products');

  const store = MOCK_STORE;

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating));
  };

  // ── Products tab ──────────────────────────────────────────────
  const renderProductItem = ({ item }: { item: StoreProduct }) => (
    <TouchableOpacity
      className="mb-3 overflow-hidden rounded-xl bg-white"
      style={{ width: (SCREEN_WIDTH - 48) / 2, elevation: 2 }}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View className="h-24 items-center justify-center bg-surface">
        <Text className="text-3xl">🔧</Text>
      </View>
      <View className="p-2">
        <Text className="mb-1 text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }} numberOfLines={2}>
          {item.nameAr}
        </Text>
        <Text className="text-sm text-accent" style={{ fontFamily: FONTS.bold }}>
          {item.price} {t('common.egp', 'ج.م')}
        </Text>
        <Text className="text-xs text-gold">★ {item.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  // ── Reviews tab ───────────────────────────────────────────────
  const renderReviewItem = ({ item }: { item: Review }) => (
    <View className="mb-3 rounded-xl bg-white p-4" style={{ elevation: 1 }}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
          {item.userNameAr}
        </Text>
        <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular }}>
          {item.date}
        </Text>
      </View>
      <Text className="mb-2 text-sm text-gold">{renderStars(item.rating)}</Text>
      <Text className="text-sm text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
        {item.commentAr}
      </Text>
    </View>
  );

  // ── Info tab ──────────────────────────────────────────────────
  const renderInfoTab = () => (
    <View className="px-4 py-4">
      {/* Description */}
      <Text className="mb-4 text-sm leading-6 text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
        {store.descriptionAr}
      </Text>

      {/* Working hours */}
      <View className="mb-4 rounded-xl bg-white p-4" style={{ elevation: 1 }}>
        <Text className="mb-2 text-sm text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
          {t('store.workingHours', 'ساعات العمل')}
        </Text>
        <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
          {store.workingHours.weekdaysAr}
        </Text>
        <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
          {store.workingHours.fridayAr}
        </Text>
      </View>

      {/* Location */}
      <View className="mb-4 rounded-xl bg-white p-4" style={{ elevation: 1 }}>
        <Text className="mb-2 text-sm text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
          {t('store.location', 'الموقع')}
        </Text>
        <Text className="mb-2 text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
          {store.locationAr}
        </Text>
        {/* Map preview placeholder */}
        <View className="h-32 items-center justify-center rounded-lg bg-surface">
          <Text className="text-3xl">🗺️</Text>
          <Text className="mt-1 text-xs text-text-secondary" style={{ fontFamily: FONTS.regular }}>
            {t('store.mapPreview', 'معاينة الخريطة')}
          </Text>
        </View>
      </View>

      {/* Delivery zones */}
      <View className="mb-4 rounded-xl bg-white p-4" style={{ elevation: 1 }}>
        <Text className="mb-2 text-sm text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
          {t('store.deliveryZones', 'مناطق التوصيل')}
        </Text>
        <View className="flex-row flex-wrap">
          {store.deliveryZones.map((zone, i) => (
            <View key={i} className="mb-2 mr-2 rounded-full bg-accent/10 px-3 py-1">
              <Text className="text-xs text-accent" style={{ fontFamily: FONTS.medium }}>
                {zone}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover image */}
        <View className="relative h-40 items-center justify-center bg-primary">
          <Text className="text-5xl opacity-20">🏪</Text>
          <TouchableOpacity
            className="absolute left-4 top-4 h-10 w-10 items-center justify-center rounded-full bg-black/30"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-lg text-white">←</Text>
          </TouchableOpacity>
        </View>

        {/* Logo + store info */}
        <View className="-mt-10 items-center px-4">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-primary" style={{ elevation: 4 }}>
            <Text className="text-2xl text-white" style={{ fontFamily: FONTS.bold }}>
              {store.nameAr.charAt(0)}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="text-xl text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
              {store.nameAr}
            </Text>
            {store.verified && (
              <View className="mr-2 rounded-full bg-info px-2 py-0.5">
                <Text className="text-xs text-white" style={{ fontFamily: FONTS.medium }}>
                  ✓ {t('store.verified', 'موثق')}
                </Text>
              </View>
            )}
          </View>

          <Text className="my-1 text-sm text-gold" style={{ fontFamily: FONTS.medium }}>
            {renderStars(store.rating)} {store.rating} ({store.reviewCount})
          </Text>

          {/* Contact buttons */}
          <View className="mb-4 mt-2 flex-row">
            <TouchableOpacity
              className="mx-1 flex-row items-center rounded-lg bg-success px-4 py-2"
              onPress={() => Linking.openURL(`https://wa.me/${store.whatsapp}`)}
            >
              <Text className="text-sm text-white" style={{ fontFamily: FONTS.medium }}>
                {t('store.whatsapp', 'واتساب')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mx-1 flex-row items-center rounded-lg bg-accent px-4 py-2"
              onPress={() => Linking.openURL(`tel:${store.phone}`)}
            >
              <Text className="text-sm text-white" style={{ fontFamily: FONTS.medium }}>
                {t('store.call', 'اتصال')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab bar */}
        <View className="flex-row border-b border-border bg-white">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 items-center py-3 ${
                activeTab === tab.key ? 'border-b-2 border-accent' : ''
              }`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                className={`text-sm ${activeTab === tab.key ? 'text-accent' : 'text-text-secondary'}`}
                style={{ fontFamily: activeTab === tab.key ? FONTS.bold : FONTS.regular }}
              >
                {tab.labelAr}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === 'products' && (
          <FlatList
            data={MOCK_PRODUCTS}
            numColumns={2}
            keyExtractor={(item) => item.id}
            renderItem={renderProductItem}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
            scrollEnabled={false}
          />
        )}

        {activeTab === 'reviews' && (
          <FlatList
            data={MOCK_REVIEWS}
            keyExtractor={(item) => item.id}
            renderItem={renderReviewItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
            scrollEnabled={false}
          />
        )}

        {activeTab === 'info' && renderInfoTab()}
      </ScrollView>
    </SafeAreaView>
  );
}
