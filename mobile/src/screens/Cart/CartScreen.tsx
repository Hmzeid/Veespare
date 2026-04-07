import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '@/constants/theme';

// ── Navigation types ────────────────────────────────────────────────
export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
  ProductDetail: { productId: string };
};

type Props = NativeStackScreenProps<CartStackParamList, 'Cart'>;

// ── Types ───────────────────────────────────────────────────────────
interface CartItem {
  id: string;
  productId: string;
  nameAr: string;
  price: number;
  condition: string;
  quantity: number;
  image: string | null;
  storeNameAr: string;
}

// ── Mock data ───────────────────────────────────────────────────────
const INITIAL_CART: CartItem[] = [
  { id: 'c1', productId: '1', nameAr: 'فلتر زيت تويوتا كورولا', price: 250, condition: 'جديد', quantity: 2, image: null, storeNameAr: 'قطع غيار النيل' },
  { id: 'c2', productId: '2', nameAr: 'تيل فرامل أمامي هيونداي', price: 480, condition: 'جديد', quantity: 1, image: null, storeNameAr: 'أوتو بارتس' },
  { id: 'c3', productId: '3', nameAr: 'بطارية فارتا 70 أمبير', price: 2800, condition: 'جديد', quantity: 1, image: null, storeNameAr: 'البطاريات المصرية' },
];

const DELIVERY_FEE = 50;

// ── Component ───────────────────────────────────────────────────────
export default function CartScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = cartItems.length > 0 ? subtotal + DELIVERY_FEE : 0;

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View className="mb-3 flex-row rounded-xl bg-white p-3" style={{ elevation: 2 }}>
      {/* Image placeholder */}
      <View className="ml-3 h-20 w-20 items-center justify-center rounded-lg bg-surface">
        <Text className="text-3xl">🔧</Text>
      </View>

      {/* Details */}
      <View className="flex-1">
        <Text
          className="mb-1 text-sm text-text-primary"
          style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }}
          numberOfLines={2}
        >
          {item.nameAr}
        </Text>

        <View className="mb-1 flex-row items-center">
          <View className="rounded-full bg-success/20 px-2 py-0.5">
            <Text className="text-xs text-success" style={{ fontFamily: FONTS.medium }}>
              {item.condition}
            </Text>
          </View>
          <Text className="mr-2 text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
            {item.storeNameAr}
          </Text>
        </View>

        <Text className="mb-2 text-base text-accent" style={{ fontFamily: FONTS.bold }}>
          {item.price} {t('common.egp', 'ج.م')}
        </Text>

        {/* Quantity + remove */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center rounded-lg bg-surface">
            <TouchableOpacity
              className="px-3 py-1"
              onPress={() => updateQuantity(item.id, -1)}
            >
              <Text className="text-lg text-text-primary" style={{ fontFamily: FONTS.bold }}>-</Text>
            </TouchableOpacity>
            <Text className="px-3 text-sm text-text-primary" style={{ fontFamily: FONTS.bold }}>
              {item.quantity}
            </Text>
            <TouchableOpacity
              className="px-3 py-1"
              onPress={() => updateQuantity(item.id, 1)}
            >
              <Text className="text-lg text-text-primary" style={{ fontFamily: FONTS.bold }}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => removeItem(item.id)}>
            <Text className="text-sm text-error" style={{ fontFamily: FONTS.medium }}>
              {t('cart.remove', 'حذف')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ── Empty state ─────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-6xl">🛒</Text>
          <Text
            className="mb-2 text-xl text-text-primary"
            style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
          >
            {t('cart.empty', 'السلة فارغة')}
          </Text>
          <Text
            className="mb-6 text-center text-sm text-text-secondary"
            style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}
          >
            {t('cart.emptyMessage', 'ابدأ بإضافة قطع غيار إلى سلة التسوق')}
          </Text>
          <TouchableOpacity
            className="rounded-xl bg-accent px-8 py-3"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-base text-white" style={{ fontFamily: FONTS.bold }}>
              {t('cart.startShopping', 'تسوق الآن')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center bg-white px-4 py-3" style={{ elevation: 2 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="ml-3">
          <Text className="text-lg text-text-primary">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg text-text-primary" style={{ fontFamily: FONTS.bold }}>
          {t('cart.title', 'سلة التسوق')} ({cartItems.length})
        </Text>
        <View className="w-8" />
      </View>

      {/* Cart items */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={renderCartItem}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Summary + checkout */}
      <View className="border-t border-border bg-white px-4 py-4" style={{ elevation: 8 }}>
        <View className="mb-2 flex-row justify-between">
          <Text className="text-sm text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
            {t('cart.subtotal', 'المجموع الفرعي')}
          </Text>
          <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold }}>
            {subtotal} {t('common.egp', 'ج.م')}
          </Text>
        </View>
        <View className="mb-2 flex-row justify-between">
          <Text className="text-sm text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
            {t('cart.deliveryFee', 'رسوم التوصيل')}
          </Text>
          <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold }}>
            {DELIVERY_FEE} {t('common.egp', 'ج.م')}
          </Text>
        </View>
        <View className="mb-4 flex-row justify-between border-t border-border pt-2">
          <Text className="text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
            {t('cart.total', 'الإجمالي')}
          </Text>
          <Text className="text-base text-accent" style={{ fontFamily: FONTS.bold }}>
            {total} {t('common.egp', 'ج.م')}
          </Text>
        </View>

        <TouchableOpacity
          className="items-center rounded-xl bg-accent py-4"
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text className="text-base text-white" style={{ fontFamily: FONTS.bold }}>
            {t('cart.checkout', 'إتمام الطلب')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
