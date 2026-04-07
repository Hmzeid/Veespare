import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '@/constants/theme';

// ── Navigation types ────────────────────────────────────────────────
export type ProductDetailStackParamList = {
  ProductDetail: { productId: string };
  StoreProfile: { storeId: string };
  Cart: undefined;
};

type Props = NativeStackScreenProps<ProductDetailStackParamList, 'ProductDetail'>;

// ── Types ───────────────────────────────────────────────────────────
interface ProductImage {
  id: string;
  uri: string | null;
}

interface ComparisonPrice {
  storeId: string;
  storeNameAr: string;
  price: number;
  condition: string;
  inStock: boolean;
}

// ── Mock data ───────────────────────────────────────────────────────
const MOCK_IMAGES: ProductImage[] = [
  { id: '1', uri: null },
  { id: '2', uri: null },
  { id: '3', uri: null },
];

const MOCK_PRODUCT = {
  id: '1',
  nameAr: 'فلتر زيت تويوتا كورولا 2018-2023',
  nameEn: 'Toyota Corolla Oil Filter 2018-2023',
  oemNumber: 'OEM-90915-YZZD4',
  price: 250,
  originalPrice: 320,
  condition: 'new' as const,
  inStock: true,
  stockCount: 15,
  aiAuthenticityScore: 92,
  description: 'فلتر زيت أصلي تويوتا مناسب لموديلات كورولا من 2018 إلى 2023. جودة عالية وأداء ممتاز.',
  compatibleCars: [
    'تويوتا كورولا 2018-2023',
    'تويوتا يارس 2020-2023',
    'تويوتا راف فور 2019-2022',
  ],
  warranty: '6 أشهر ضمان من المتجر',
  store: {
    id: 's1',
    nameAr: 'قطع غيار النيل',
    rating: 4.5,
    reviewCount: 128,
    verified: true,
    locationAr: 'شارع أحمد عرابي، المهندسين، الجيزة',
  },
};

const COMPARISON_PRICES: ComparisonPrice[] = [
  { storeId: 's1', storeNameAr: 'قطع غيار النيل', price: 250, condition: 'جديد', inStock: true },
  { storeId: 's2', storeNameAr: 'أوتو بارتس مصر', price: 280, condition: 'جديد', inStock: true },
  { storeId: 's3', storeNameAr: 'الشرق للقطع', price: 230, condition: 'مجدد', inStock: true },
  { storeId: 's4', storeNameAr: 'قطع الدلتا', price: 310, condition: 'جديد', inStock: false },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Helpers ─────────────────────────────────────────────────────────
function authenticityBadge(score: number) {
  if (score >= 80) return { color: 'bg-success', label: 'أصلي - موثوق', icon: '✅' };
  if (score >= 50) return { color: 'bg-warning', label: 'يحتاج تحقق', icon: '⚠️' };
  return { color: 'bg-error', label: 'مشتبه به', icon: '❌' };
}

function conditionBadge(c: string) {
  switch (c) {
    case 'new': return { color: 'bg-success', label: 'جديد' };
    case 'used': return { color: 'bg-warning', label: 'مستعمل' };
    case 'refurbished': return { color: 'bg-info', label: 'مجدد' };
    default: return { color: 'bg-text-secondary', label: c };
  }
}

// ── Component ───────────────────────────────────────────────────────
export default function ProductDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { productId } = route.params;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const product = MOCK_PRODUCT;
  const auth = authenticityBadge(product.aiAuthenticityScore);
  const cond = conditionBadge(product.condition);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Back button */}
        <TouchableOpacity
          className="absolute left-4 top-4 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/30"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-lg text-white">←</Text>
        </TouchableOpacity>

        {/* Image gallery */}
        <FlatList
          data={MOCK_IMAGES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              className="items-center justify-center bg-white"
              style={{ width: SCREEN_WIDTH, height: 280 }}
            >
              <Text className="text-6xl">🔧</Text>
            </View>
          )}
        />

        {/* Dot indicators */}
        <View className="flex-row items-center justify-center py-3">
          {MOCK_IMAGES.map((_, i) => (
            <View
              key={i}
              className={`mx-1 rounded-full ${
                i === currentImageIndex ? 'h-2.5 w-6 bg-accent' : 'h-2.5 w-2.5 bg-border'
              }`}
            />
          ))}
        </View>

        <View className="px-4">
          {/* Product name + OEM */}
          <Text
            className="mb-1 text-xl text-text-primary"
            style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
          >
            {product.nameAr}
          </Text>
          <Text
            className="mb-3 text-sm text-text-secondary"
            style={{ fontFamily: FONTS.regular }}
          >
            {product.oemNumber}
          </Text>

          {/* Price + condition + stock */}
          <View className="mb-4 flex-row flex-wrap items-center">
            <Text className="ml-3 text-2xl text-accent" style={{ fontFamily: FONTS.bold }}>
              {product.price} {t('common.egp', 'ج.م')}
            </Text>
            {product.originalPrice > product.price && (
              <Text className="ml-3 text-sm text-text-secondary line-through" style={{ fontFamily: FONTS.regular }}>
                {product.originalPrice} {t('common.egp', 'ج.م')}
              </Text>
            )}
            <View className={`mr-2 rounded-full px-3 py-1 ${cond.color}`}>
              <Text className="text-xs text-white" style={{ fontFamily: FONTS.medium }}>
                {cond.label}
              </Text>
            </View>
            <View className={`rounded-full px-3 py-1 ${product.inStock ? 'bg-success/20' : 'bg-error/20'}`}>
              <Text
                className={`text-xs ${product.inStock ? 'text-success' : 'text-error'}`}
                style={{ fontFamily: FONTS.medium }}
              >
                {product.inStock
                  ? `${t('product.inStock', 'متوفر')} (${product.stockCount})`
                  : t('product.outOfStock', 'غير متوفر')}
              </Text>
            </View>
          </View>

          {/* AI authenticity badge */}
          <View className={`mb-4 flex-row items-center rounded-xl p-3 ${auth.color}/10`}>
            <Text className="ml-2 text-2xl">{auth.icon}</Text>
            <View className="flex-1">
              <Text
                className="text-sm text-text-primary"
                style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
              >
                {t('product.aiVerification', 'تحقق الذكاء الاصطناعي')}
              </Text>
              <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                {auth.label} - {t('product.score', 'النتيجة')}: {product.aiAuthenticityScore}%
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text
            className="mb-4 text-sm leading-6 text-text-secondary"
            style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}
          >
            {product.description}
          </Text>

          {/* Compatible cars */}
          <View className="mb-4">
            <Text className="mb-2 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
              {t('product.compatibleCars', 'السيارات المتوافقة')}
            </Text>
            {product.compatibleCars.map((car, i) => (
              <View key={i} className="mb-1 flex-row items-center">
                <Text className="ml-2 text-sm text-accent">●</Text>
                <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                  {car}
                </Text>
              </View>
            ))}
          </View>

          {/* Price comparison table */}
          <View className="mb-4">
            <Text className="mb-2 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
              {t('product.priceComparison', 'مقارنة الأسعار')}
            </Text>
            <View className="overflow-hidden rounded-xl bg-white" style={{ elevation: 2 }}>
              {/* Header */}
              <View className="flex-row bg-primary/5 px-3 py-2">
                <Text className="flex-1 text-xs text-text-secondary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
                  {t('product.store', 'المتجر')}
                </Text>
                <Text className="w-16 text-center text-xs text-text-secondary" style={{ fontFamily: FONTS.bold }}>
                  {t('product.condition', 'الحالة')}
                </Text>
                <Text className="w-20 text-center text-xs text-text-secondary" style={{ fontFamily: FONTS.bold }}>
                  {t('product.price', 'السعر')}
                </Text>
              </View>
              {COMPARISON_PRICES.map((cp, i) => (
                <TouchableOpacity
                  key={cp.storeId}
                  className={`flex-row items-center px-3 py-3 ${i < COMPARISON_PRICES.length - 1 ? 'border-b border-border' : ''}`}
                  onPress={() => navigation.navigate('StoreProfile', { storeId: cp.storeId })}
                >
                  <Text
                    className="flex-1 text-sm text-text-primary"
                    style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}
                    numberOfLines={1}
                  >
                    {cp.storeNameAr}
                  </Text>
                  <Text className="w-16 text-center text-xs text-text-secondary" style={{ fontFamily: FONTS.regular }}>
                    {cp.condition}
                  </Text>
                  <View className="w-20 items-center">
                    <Text
                      className={`text-sm ${cp.inStock ? 'text-accent' : 'text-text-secondary line-through'}`}
                      style={{ fontFamily: FONTS.bold }}
                    >
                      {cp.price} {t('common.egp', 'ج.م')}
                    </Text>
                    {!cp.inStock && (
                      <Text className="text-xs text-error" style={{ fontFamily: FONTS.regular }}>
                        {t('product.outOfStock', 'غير متوفر')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Warranty */}
          {product.warranty && (
            <View className="mb-4 flex-row items-center rounded-xl bg-gold/10 p-3">
              <Text className="ml-2 text-xl">🛡️</Text>
              <Text className="flex-1 text-sm text-text-primary" style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}>
                {product.warranty}
              </Text>
            </View>
          )}

          {/* Store info */}
          <TouchableOpacity
            className="mb-6 rounded-xl bg-white p-4"
            style={{ elevation: 2 }}
            onPress={() => navigation.navigate('StoreProfile', { storeId: product.store.id })}
          >
            <View className="flex-row items-center">
              <View className="ml-3 h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Text className="text-lg text-white" style={{ fontFamily: FONTS.bold }}>
                  {product.store.nameAr.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
                    {product.store.nameAr}
                  </Text>
                  {product.store.verified && (
                    <Text className="mr-1 text-sm text-info">✓</Text>
                  )}
                </View>
                <Text className="text-xs text-gold" style={{ fontFamily: FONTS.medium }}>
                  ★ {product.store.rating} ({product.store.reviewCount} {t('product.reviews', 'تقييم')})
                </Text>
                <Text
                  className="text-xs text-text-secondary"
                  style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}
                  numberOfLines={1}
                >
                  {product.store.locationAr}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky add to cart */}
      <View className="flex-row items-center border-t border-border bg-white px-4 py-3" style={{ elevation: 8 }}>
        {/* Quantity selector */}
        <View className="ml-3 flex-row items-center rounded-lg bg-surface">
          <TouchableOpacity
            className="px-3 py-2"
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text className="text-lg text-text-primary" style={{ fontFamily: FONTS.bold }}>-</Text>
          </TouchableOpacity>
          <Text className="px-3 text-base text-text-primary" style={{ fontFamily: FONTS.bold }}>
            {quantity}
          </Text>
          <TouchableOpacity
            className="px-3 py-2"
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text className="text-lg text-text-primary" style={{ fontFamily: FONTS.bold }}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="flex-1 items-center rounded-xl bg-accent py-3"
          activeOpacity={0.8}
        >
          <Text className="text-base text-white" style={{ fontFamily: FONTS.bold }}>
            {t('product.addToCart', 'أضف إلى السلة')} - {product.price * quantity} {t('common.egp', 'ج.م')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
