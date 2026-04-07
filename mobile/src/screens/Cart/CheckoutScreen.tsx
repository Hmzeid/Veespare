import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '@/constants/theme';

// ── Navigation types ────────────────────────────────────────────────
export type CheckoutStackParamList = {
  Checkout: undefined;
  OrderTracking: { orderId: string };
};

type Props = NativeStackScreenProps<CheckoutStackParamList, 'Checkout'>;

// ── Types ───────────────────────────────────────────────────────────
type DeliveryMethod = 'delivery' | 'pickup';
type PaymentMethod = 'fawry' | 'vodafone_cash' | 'card' | 'cod' | 'instapay';

interface PaymentOption {
  key: PaymentMethod;
  labelAr: string;
  icon: string;
}

// ── Constants ───────────────────────────────────────────────────────
const PAYMENT_OPTIONS: PaymentOption[] = [
  { key: 'cod', labelAr: 'الدفع عند الاستلام', icon: '💵' },
  { key: 'fawry', labelAr: 'فوري', icon: '🏪' },
  { key: 'vodafone_cash', labelAr: 'فودافون كاش', icon: '📱' },
  { key: 'card', labelAr: 'بطاقة ائتمان', icon: '💳' },
  { key: 'instapay', labelAr: 'إنستا باي', icon: '🏦' },
];

const MOCK_ADDRESSES = [
  { id: '1', labelAr: 'المنزل', addressAr: 'شارع 9، المعادي، القاهرة' },
  { id: '2', labelAr: 'العمل', addressAr: 'شارع التحرير، الدقي، الجيزة' },
];

// ── Mock order summary ──────────────────────────────────────────────
const ORDER_ITEMS = [
  { nameAr: 'فلتر زيت تويوتا كورولا', qty: 2, price: 250 },
  { nameAr: 'تيل فرامل أمامي هيونداي', qty: 1, price: 480 },
];

const SUBTOTAL = 980;
const DELIVERY_FEE = 50;
const TOTAL = 1030;

// ── Component ───────────────────────────────────────────────────────
export default function CheckoutScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [selectedAddress, setSelectedAddress] = useState(MOCK_ADDRESSES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [notes, setNotes] = useState('');

  const handlePlaceOrder = () => {
    Alert.alert(
      t('checkout.confirmTitle', 'تأكيد الطلب'),
      t('checkout.confirmMessage', 'هل تريد تأكيد الطلب؟'),
      [
        { text: t('common.cancel', 'إلغاء'), style: 'cancel' },
        {
          text: t('common.confirm', 'تأكيد'),
          onPress: () => {
            // Navigate to order tracking
            (navigation as any).replace('OrderTracking', { orderId: 'ORD-2024-001' });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center bg-white px-4 py-3" style={{ elevation: 2 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="ml-3">
          <Text className="text-lg text-text-primary">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg text-text-primary" style={{ fontFamily: FONTS.bold }}>
          {t('checkout.title', 'إتمام الطلب')}
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Delivery method toggle */}
          <Text className="mb-2 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
            {t('checkout.deliveryMethod', 'طريقة الاستلام')}
          </Text>
          <View className="mb-4 flex-row overflow-hidden rounded-xl bg-white" style={{ elevation: 1 }}>
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${deliveryMethod === 'delivery' ? 'bg-accent' : ''}`}
              onPress={() => setDeliveryMethod('delivery')}
            >
              <Text
                className={`text-sm ${deliveryMethod === 'delivery' ? 'text-white' : 'text-text-primary'}`}
                style={{ fontFamily: FONTS.semiBold }}
              >
                🚚 {t('checkout.delivery', 'توصيل')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center py-3 ${deliveryMethod === 'pickup' ? 'bg-accent' : ''}`}
              onPress={() => setDeliveryMethod('pickup')}
            >
              <Text
                className={`text-sm ${deliveryMethod === 'pickup' ? 'text-white' : 'text-text-primary'}`}
                style={{ fontFamily: FONTS.semiBold }}
              >
                🏪 {t('checkout.pickup', 'استلام من المتجر')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Address selection (if delivery) */}
          {deliveryMethod === 'delivery' && (
            <View className="mb-4">
              <Text className="mb-2 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
                {t('checkout.address', 'عنوان التوصيل')}
              </Text>
              {MOCK_ADDRESSES.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  className={`mb-2 flex-row items-center rounded-xl border-2 p-3 ${
                    selectedAddress === addr.id ? 'border-accent bg-accent/5' : 'border-border bg-white'
                  }`}
                  onPress={() => setSelectedAddress(addr.id)}
                >
                  <View className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
                    selectedAddress === addr.id ? 'border-accent' : 'border-border'
                  }`}>
                    {selectedAddress === addr.id && (
                      <View className="h-3 w-3 rounded-full bg-accent" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }}>
                      {addr.labelAr}
                    </Text>
                    <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                      {addr.addressAr}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity className="items-center py-2">
                <Text className="text-sm text-accent" style={{ fontFamily: FONTS.medium }}>
                  + {t('checkout.addAddress', 'إضافة عنوان جديد')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Payment method */}
          <Text className="mb-2 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
            {t('checkout.paymentMethod', 'طريقة الدفع')}
          </Text>
          <View className="mb-4">
            {PAYMENT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                className={`mb-2 flex-row items-center rounded-xl border-2 p-3 ${
                  paymentMethod === opt.key ? 'border-accent bg-accent/5' : 'border-border bg-white'
                }`}
                onPress={() => setPaymentMethod(opt.key)}
              >
                <View className={`mr-3 h-5 w-5 items-center justify-center rounded-full border-2 ${
                  paymentMethod === opt.key ? 'border-accent' : 'border-border'
                }`}>
                  {paymentMethod === opt.key && (
                    <View className="h-3 w-3 rounded-full bg-accent" />
                  )}
                </View>
                <Text className="ml-2 text-xl">{opt.icon}</Text>
                <Text className="flex-1 text-sm text-text-primary" style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}>
                  {opt.labelAr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Order summary */}
          <Text className="mb-2 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
            {t('checkout.orderSummary', 'ملخص الطلب')}
          </Text>
          <View className="mb-4 rounded-xl bg-white p-3" style={{ elevation: 1 }}>
            {ORDER_ITEMS.map((item, i) => (
              <View key={i} className={`flex-row items-center justify-between py-2 ${i < ORDER_ITEMS.length - 1 ? 'border-b border-border' : ''}`}>
                <Text className="flex-1 text-sm text-text-primary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                  {item.nameAr} x{item.qty}
                </Text>
                <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold }}>
                  {item.price * item.qty} {t('common.egp', 'ج.م')}
                </Text>
              </View>
            ))}
            <View className="mt-2 border-t border-border pt-2">
              <View className="flex-row justify-between">
                <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                  {t('cart.subtotal', 'المجموع الفرعي')}
                </Text>
                <Text className="text-xs text-text-primary" style={{ fontFamily: FONTS.medium }}>
                  {SUBTOTAL} {t('common.egp', 'ج.م')}
                </Text>
              </View>
              {deliveryMethod === 'delivery' && (
                <View className="flex-row justify-between">
                  <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                    {t('cart.deliveryFee', 'رسوم التوصيل')}
                  </Text>
                  <Text className="text-xs text-text-primary" style={{ fontFamily: FONTS.medium }}>
                    {DELIVERY_FEE} {t('common.egp', 'ج.م')}
                  </Text>
                </View>
              )}
              <View className="mt-1 flex-row justify-between border-t border-border pt-1">
                <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
                  {t('cart.total', 'الإجمالي')}
                </Text>
                <Text className="text-sm text-accent" style={{ fontFamily: FONTS.bold }}>
                  {deliveryMethod === 'delivery' ? TOTAL : SUBTOTAL} {t('common.egp', 'ج.م')}
                </Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          <Text className="mb-2 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
            {t('checkout.notes', 'ملاحظات')}
          </Text>
          <TextInput
            className="mb-6 rounded-xl bg-white p-3 text-sm"
            style={{ fontFamily: FONTS.regular, textAlign: 'right', writingDirection: 'rtl', minHeight: 80 }}
            placeholder={t('checkout.notesPlaceholder', 'أضف ملاحظات للطلب (اختياري)...')}
            placeholderTextColor={COLORS.textSecondary}
            multiline
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      {/* Place order button */}
      <View className="border-t border-border bg-white px-4 py-4" style={{ elevation: 8 }}>
        <TouchableOpacity
          className="items-center rounded-xl bg-accent py-4"
          activeOpacity={0.8}
          onPress={handlePlaceOrder}
        >
          <Text className="text-base text-white" style={{ fontFamily: FONTS.bold }}>
            {t('checkout.placeOrder', 'تأكيد الطلب')} - {deliveryMethod === 'delivery' ? TOTAL : SUBTOTAL} {t('common.egp', 'ج.م')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
