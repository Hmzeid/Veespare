import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS, CAR_CATEGORIES } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

// ── Navigation types ────────────────────────────────────────────────
export type HomeStackParamList = {
  Home: undefined;
  Search: { query?: string; categoryId?: string } | undefined;
  ProductDetail: { productId: string };
  StoreProfile: { storeId: string };
};

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

// ── Mock data ───────────────────────────────────────────────────────
const FEATURED_PARTS = [
  {
    id: '1',
    nameAr: 'فلتر زيت تويوتا',
    price: 250,
    originalPrice: 320,
    image: null,
    condition: 'new' as const,
    rating: 4.5,
    storeNameAr: 'قطع غيار النيل',
  },
  {
    id: '2',
    nameAr: 'تيل فرامل هيونداي',
    price: 480,
    originalPrice: 550,
    image: null,
    condition: 'new' as const,
    rating: 4.8,
    storeNameAr: 'أوتو بارتس',
  },
  {
    id: '3',
    nameAr: 'بطارية فارتا 70 أمبير',
    price: 2800,
    originalPrice: 3200,
    image: null,
    condition: 'new' as const,
    rating: 4.3,
    storeNameAr: 'البطاريات المصرية',
  },
  {
    id: '4',
    nameAr: 'رديتر مياه كيا',
    price: 1500,
    originalPrice: 1800,
    image: null,
    condition: 'refurbished' as const,
    rating: 4.1,
    storeNameAr: 'قطع غيار الدلتا',
  },
];

const NEARBY_STORES = [
  { id: '1', nameAr: 'قطع غيار النيل', rating: 4.5, distance: '1.2 كم', partsCount: 450 },
  { id: '2', nameAr: 'أوتو بارتس مصر', rating: 4.8, distance: '2.5 كم', partsCount: 1200 },
  { id: '3', nameAr: 'الشرق للقطع', rating: 4.2, distance: '3.0 كم', partsCount: 680 },
];

const CAR_MAKES = ['تويوتا', 'هيونداي', 'كيا', 'نيسان', 'شيفروليه', 'بي إم دبليو'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Condition badge helper ──────────────────────────────────────────
function conditionLabel(c: string): string {
  switch (c) {
    case 'new':
      return 'جديد';
    case 'used':
      return 'مستعمل';
    case 'refurbished':
      return 'مجدد';
    default:
      return c;
  }
}

function conditionColor(c: string): string {
  switch (c) {
    case 'new':
      return 'bg-success';
    case 'used':
      return 'bg-warning';
    case 'refurbished':
      return 'bg-info';
    default:
      return 'bg-text-secondary';
  }
}

// ── Component ───────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMake, setSelectedMake] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const navigateToSearch = (query?: string, categoryId?: string) => {
    navigation.navigate('Search', { query, categoryId });
  };

  // ── Render helpers ──────────────────────────────────────────────
  const renderCategoryItem = (item: (typeof CAR_CATEGORIES)[number]) => (
    <TouchableOpacity
      key={item.id}
      className="mr-3 items-center rounded-xl bg-white p-3"
      style={{ width: 90, elevation: 2 }}
      onPress={() => navigateToSearch(undefined, item.id)}
    >
      <Text className="mb-1 text-3xl">{item.icon}</Text>
      <Text
        className="text-center text-xs text-text-primary"
        style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }}
        numberOfLines={1}
      >
        {item.nameAr}
      </Text>
    </TouchableOpacity>
  );

  const renderProductCard = (item: (typeof FEATURED_PARTS)[number]) => (
    <TouchableOpacity
      key={item.id}
      className="mb-3 overflow-hidden rounded-xl bg-white"
      style={{ width: (SCREEN_WIDTH - 48) / 2, elevation: 3 }}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      {/* Image placeholder */}
      <View className="h-28 items-center justify-center bg-surface">
        <Text className="text-4xl">🔧</Text>
      </View>

      {/* Condition badge */}
      <View className={`absolute left-2 top-2 rounded-full px-2 py-0.5 ${conditionColor(item.condition)}`}>
        <Text className="text-xs text-white" style={{ fontFamily: FONTS.medium }}>
          {conditionLabel(item.condition)}
        </Text>
      </View>

      <View className="p-2">
        <Text
          className="mb-1 text-sm text-text-primary"
          style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }}
          numberOfLines={2}
        >
          {item.nameAr}
        </Text>

        <View className="flex-row items-center">
          <Text
            className="text-base text-accent"
            style={{ fontFamily: FONTS.bold }}
          >
            {item.price} {t('common.egp', 'ج.م')}
          </Text>
          {item.originalPrice > item.price && (
            <Text
              className="mr-2 text-xs text-text-secondary line-through"
              style={{ fontFamily: FONTS.regular }}
            >
              {item.originalPrice}
            </Text>
          )}
        </View>

        <View className="mt-1 flex-row items-center">
          <Text className="text-xs text-gold">{'★'.repeat(Math.round(item.rating))}</Text>
          <Text className="mr-1 text-xs text-text-secondary" style={{ fontFamily: FONTS.regular }}>
            {item.rating}
          </Text>
        </View>

        <Text
          className="mt-1 text-xs text-text-secondary"
          style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}
          numberOfLines={1}
        >
          {item.storeNameAr}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderStoreCard = (item: (typeof NEARBY_STORES)[number]) => (
    <TouchableOpacity
      key={item.id}
      className="mr-3 w-44 rounded-xl bg-white p-3"
      style={{ elevation: 2 }}
      onPress={() => navigation.navigate('StoreProfile', { storeId: item.id })}
    >
      {/* Logo placeholder */}
      <View className="mb-2 h-12 w-12 items-center justify-center self-center rounded-full bg-primary">
        <Text className="text-lg text-white" style={{ fontFamily: FONTS.bold }}>
          {item.nameAr.charAt(0)}
        </Text>
      </View>
      <Text
        className="mb-1 text-center text-sm text-text-primary"
        style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }}
        numberOfLines={1}
      >
        {item.nameAr}
      </Text>
      <Text className="text-center text-xs text-gold" style={{ fontFamily: FONTS.medium }}>
        ★ {item.rating} · {item.distance}
      </Text>
      <Text
        className="mt-1 text-center text-xs text-text-secondary"
        style={{ fontFamily: FONTS.regular }}
      >
        {item.partsCount} {t('home.parts', 'قطعة')}
      </Text>
    </TouchableOpacity>
  );

  // ── Main render ─────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.accent]}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Header */}
        <View className="bg-primary px-4 pb-6 pt-4">
          <Text
            className="mb-1 text-xl text-white"
            style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
          >
            {t('home.greeting', 'أهلاً')} {user?.firstName || t('home.guest', 'ضيف')}
          </Text>
          <Text
            className="mb-4 text-sm text-white/60"
            style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}
          >
            {t('home.subtitle', 'ابحث عن قطع غيار سيارتك')}
          </Text>

          {/* Search bar */}
          <TouchableOpacity
            className="flex-row items-center rounded-xl bg-white/10 px-4 py-3"
            onPress={() => navigateToSearch()}
          >
            <Text className="text-lg text-white/40">🔍</Text>
            <Text
              className="mr-3 flex-1 text-sm text-white/40"
              style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}
            >
              {t('home.searchPlaceholder', 'ابحث عن قطعة غيار...')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Car selector */}
        <View className="px-4 py-4">
          <Text
            className="mb-3 text-base text-text-primary"
            style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
          >
            {t('home.selectCar', 'اختر سيارتك')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CAR_MAKES.map((make) => (
              <TouchableOpacity
                key={make}
                className={`mr-2 rounded-full px-4 py-2 ${
                  selectedMake === make ? 'bg-accent' : 'bg-white'
                }`}
                onPress={() => setSelectedMake(selectedMake === make ? null : make)}
              >
                <Text
                  className={`text-sm ${
                    selectedMake === make ? 'text-white' : 'text-text-primary'
                  }`}
                  style={{ fontFamily: FONTS.medium }}
                >
                  {make}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories */}
        <View className="px-4 pb-4">
          <Text
            className="mb-3 text-base text-text-primary"
            style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
          >
            {t('home.categories', 'التصنيفات')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CAR_CATEGORIES.map(renderCategoryItem)}
          </ScrollView>
        </View>

        {/* Featured parts */}
        <View className="px-4 pb-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text
              className="text-base text-text-primary"
              style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
            >
              {t('home.featuredParts', 'قطع مميزة')}
            </Text>
            <TouchableOpacity onPress={() => navigateToSearch()}>
              <Text className="text-sm text-accent" style={{ fontFamily: FONTS.medium }}>
                {t('home.seeAll', 'عرض الكل')}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {FEATURED_PARTS.map(renderProductCard)}
          </View>
        </View>

        {/* Nearby stores */}
        <View className="px-4 pb-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text
              className="text-base text-text-primary"
              style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
            >
              {t('home.nearbyStores', 'متاجر قريبة منك')}
            </Text>
            <TouchableOpacity>
              <Text className="text-sm text-accent" style={{ fontFamily: FONTS.medium }}>
                {t('home.seeAll', 'عرض الكل')}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {NEARBY_STORES.map(renderStoreCard)}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
