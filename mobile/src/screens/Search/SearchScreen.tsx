import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '@/constants/theme';

// ── Navigation types ────────────────────────────────────────────────
export type SearchStackParamList = {
  Search: { query?: string; categoryId?: string } | undefined;
  ProductDetail: { productId: string };
};

type Props = NativeStackScreenProps<SearchStackParamList, 'Search'>;

// ── Types ───────────────────────────────────────────────────────────
interface Product {
  id: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  condition: 'new' | 'used' | 'refurbished';
  rating: number;
  storeNameAr: string;
  image: string | null;
}

type SortOption = 'price_asc' | 'price_desc' | 'rating' | 'newest';
type ConditionFilter = 'all' | 'new' | 'used' | 'refurbished';

// ── Mock data ───────────────────────────────────────────────────────
const MOCK_PRODUCTS: Product[] = [
  { id: '1', nameAr: 'فلتر زيت تويوتا كورولا', price: 250, originalPrice: 320, condition: 'new', rating: 4.5, storeNameAr: 'قطع غيار النيل', image: null },
  { id: '2', nameAr: 'تيل فرامل أمامي هيونداي', price: 480, condition: 'new', rating: 4.8, storeNameAr: 'أوتو بارتس', image: null },
  { id: '3', nameAr: 'دينامو كيا سيراتو', price: 3500, originalPrice: 4200, condition: 'refurbished', rating: 4.1, storeNameAr: 'الشرق للقطع', image: null },
  { id: '4', nameAr: 'مساعدين أمامي نيسان صني', price: 1200, condition: 'used', rating: 3.9, storeNameAr: 'قطع الدلتا', image: null },
  { id: '5', nameAr: 'رديتر مياه شيفروليه أوبترا', price: 1800, condition: 'new', rating: 4.6, storeNameAr: 'المهندس للقطع', image: null },
  { id: '6', nameAr: 'كمبروسر تكييف تويوتا', price: 5500, originalPrice: 6800, condition: 'new', rating: 4.4, storeNameAr: 'قطع غيار النيل', image: null },
  { id: '7', nameAr: 'طرمبة بنزين هيونداي أكسنت', price: 900, condition: 'new', rating: 4.2, storeNameAr: 'أوتو بارتس', image: null },
  { id: '8', nameAr: 'كشاف أمامي كيا سبورتاج', price: 2200, condition: 'used', rating: 3.7, storeNameAr: 'الشرق للقطع', image: null },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SORT_OPTIONS: { key: SortOption; labelAr: string }[] = [
  { key: 'price_asc', labelAr: 'السعر: من الأقل' },
  { key: 'price_desc', labelAr: 'السعر: من الأعلى' },
  { key: 'rating', labelAr: 'التقييم' },
  { key: 'newest', labelAr: 'الأحدث' },
];

const CONDITION_FILTERS: { key: ConditionFilter; labelAr: string }[] = [
  { key: 'all', labelAr: 'الكل' },
  { key: 'new', labelAr: 'جديد' },
  { key: 'used', labelAr: 'مستعمل' },
  { key: 'refurbished', labelAr: 'مجدد' },
];

// ── Component ───────────────────────────────────────────────────────
export default function SearchScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(route.params?.query || '');
  const [isGrid, setIsGrid] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Filter and sort
  const filteredProducts = products
    .filter((p) => {
      if (conditionFilter !== 'all' && p.condition !== conditionFilter) return false;
      if (query && !p.nameAr.includes(query)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const loadMore = useCallback(() => {
    // Infinite scroll placeholder
  }, []);

  const conditionBadgeColor = (c: string) => {
    switch (c) {
      case 'new': return 'bg-success';
      case 'used': return 'bg-warning';
      case 'refurbished': return 'bg-info';
      default: return 'bg-text-secondary';
    }
  };

  const conditionLabel = (c: string) => {
    switch (c) {
      case 'new': return 'جديد';
      case 'used': return 'مستعمل';
      case 'refurbished': return 'مجدد';
      default: return c;
    }
  };

  // ── Grid item ─────────────────────────────────────────────────
  const renderGridItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="mb-3 overflow-hidden rounded-xl bg-white"
      style={{ width: (SCREEN_WIDTH - 48) / 2, elevation: 2 }}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View className="h-28 items-center justify-center bg-surface">
        <Text className="text-4xl">🔧</Text>
      </View>
      <View className={`absolute left-2 top-2 rounded-full px-2 py-0.5 ${conditionBadgeColor(item.condition)}`}>
        <Text className="text-xs text-white" style={{ fontFamily: FONTS.medium }}>
          {conditionLabel(item.condition)}
        </Text>
      </View>
      <View className="p-2">
        <Text className="mb-1 text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }} numberOfLines={2}>
          {item.nameAr}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-base text-accent" style={{ fontFamily: FONTS.bold }}>
            {item.price} {t('common.egp', 'ج.م')}
          </Text>
          {item.originalPrice && (
            <Text className="mr-2 text-xs text-text-secondary line-through" style={{ fontFamily: FONTS.regular }}>
              {item.originalPrice}
            </Text>
          )}
        </View>
        <Text className="mt-1 text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }} numberOfLines={1}>
          {item.storeNameAr}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // ── List item ─────────────────────────────────────────────────
  const renderListItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="mb-3 flex-row overflow-hidden rounded-xl bg-white"
      style={{ elevation: 2 }}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View className="h-24 w-24 items-center justify-center bg-surface">
        <Text className="text-3xl">🔧</Text>
      </View>
      <View className="flex-1 justify-center p-3">
        <Text className="mb-1 text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }} numberOfLines={1}>
          {item.nameAr}
        </Text>
        <View className="mb-1 flex-row items-center">
          <View className={`rounded-full px-2 py-0.5 ${conditionBadgeColor(item.condition)}`}>
            <Text className="text-xs text-white" style={{ fontFamily: FONTS.medium }}>
              {conditionLabel(item.condition)}
            </Text>
          </View>
          <Text className="mr-2 text-xs text-gold" style={{ fontFamily: FONTS.medium }}>
            ★ {item.rating}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-base text-accent" style={{ fontFamily: FONTS.bold }}>
            {item.price} {t('common.egp', 'ج.م')}
          </Text>
          {item.originalPrice && (
            <Text className="mr-2 text-xs text-text-secondary line-through">{item.originalPrice}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Search bar */}
      <View className="flex-row items-center bg-white px-4 py-3" style={{ elevation: 2 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="ml-3">
          <Text className="text-lg text-text-primary">←</Text>
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          className="flex-1 rounded-lg bg-surface px-4 py-2 text-sm"
          style={{ fontFamily: FONTS.regular, textAlign: 'right', writingDirection: 'rtl' }}
          placeholder={t('search.placeholder', 'ابحث عن قطعة غيار...')}
          placeholderTextColor={COLORS.textSecondary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      {/* Filter chips */}
      <View className="px-4 py-2">
        <ScrollableRow>
          {CONDITION_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              className={`mr-2 rounded-full px-4 py-1.5 ${
                conditionFilter === f.key ? 'bg-accent' : 'bg-white'
              }`}
              onPress={() => setConditionFilter(f.key)}
            >
              <Text
                className={`text-xs ${conditionFilter === f.key ? 'text-white' : 'text-text-primary'}`}
                style={{ fontFamily: FONTS.medium }}
              >
                {f.labelAr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollableRow>
      </View>

      {/* Sort + view toggle */}
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          className="flex-row items-center rounded-lg bg-white px-3 py-2"
          onPress={() => setShowSortDropdown(!showSortDropdown)}
        >
          <Text className="text-xs text-text-primary" style={{ fontFamily: FONTS.medium }}>
            {SORT_OPTIONS.find((s) => s.key === sortBy)?.labelAr}
          </Text>
          <Text className="mr-1 text-xs text-text-secondary"> ▼</Text>
        </TouchableOpacity>

        <View className="flex-row">
          <TouchableOpacity
            className={`rounded-l-lg px-3 py-2 ${isGrid ? 'bg-accent' : 'bg-white'}`}
            onPress={() => setIsGrid(true)}
          >
            <Text className={`text-xs ${isGrid ? 'text-white' : 'text-text-primary'}`}>▦</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`rounded-r-lg px-3 py-2 ${!isGrid ? 'bg-accent' : 'bg-white'}`}
            onPress={() => setIsGrid(false)}
          >
            <Text className={`text-xs ${!isGrid ? 'text-white' : 'text-text-primary'}`}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort dropdown */}
      {showSortDropdown && (
        <View className="absolute left-4 top-36 z-50 rounded-lg bg-white p-2" style={{ elevation: 8 }}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              className={`rounded-md px-4 py-2 ${sortBy === opt.key ? 'bg-accent/10' : ''}`}
              onPress={() => {
                setSortBy(opt.key);
                setShowSortDropdown(false);
              }}
            >
              <Text
                className={`text-sm ${sortBy === opt.key ? 'text-accent' : 'text-text-primary'}`}
                style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}
              >
                {opt.labelAr}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Results count */}
      <Text
        className="px-4 pb-2 text-xs text-text-secondary"
        style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}
      >
        {filteredProducts.length} {t('search.results', 'نتيجة')}
      </Text>

      {/* Product list */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={isGrid ? renderGridItem : renderListItem}
        numColumns={isGrid ? 2 : 1}
        key={isGrid ? 'grid' : 'list'}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        columnWrapperStyle={isGrid ? { justifyContent: 'space-between' } : undefined}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="mb-2 text-4xl">🔍</Text>
            <Text className="text-sm text-text-secondary" style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}>
              {t('search.noResults', 'لم يتم العثور على نتائج')}
            </Text>
          </View>
        }
        ListFooterComponent={
          loading ? <ActivityIndicator color={COLORS.accent} className="py-4" /> : null
        }
      />
    </SafeAreaView>
  );
}

// ── Helper: horizontal scroll wrapper ───────────────────────────────
function ScrollableRow({ children }: { children: React.ReactNode }) {
  return (
    <FlatList
      data={React.Children.toArray(children)}
      horizontal
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => <>{item}</>}
      keyExtractor={(_, i) => String(i)}
    />
  );
}
