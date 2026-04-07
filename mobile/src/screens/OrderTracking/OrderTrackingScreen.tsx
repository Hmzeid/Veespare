import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '@/constants/theme';

// ── Navigation types ────────────────────────────────────────────────
export type OrderTrackingStackParamList = {
  OrderTracking: { orderId: string };
};

type Props = NativeStackScreenProps<OrderTrackingStackParamList, 'OrderTracking'>;

// ── Types ───────────────────────────────────────────────────────────
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered';

interface StatusStep {
  key: OrderStatus;
  labelAr: string;
  icon: string;
  time?: string;
}

// ── Mock data ───────────────────────────────────────────────────────
const MOCK_ORDER = {
  id: 'ORD-2024-001',
  date: '2024-01-20',
  currentStatus: 'preparing' as OrderStatus,
  store: {
    nameAr: 'قطع غيار النيل',
    phone: '+201234567890',
  },
  items: [
    { nameAr: 'فلتر زيت تويوتا كورولا', qty: 2, price: 250 },
    { nameAr: 'تيل فرامل أمامي هيونداي', qty: 1, price: 480 },
  ],
  total: 1030,
};

const STATUS_STEPS: StatusStep[] = [
  { key: 'pending', labelAr: 'في الانتظار', icon: '🕐', time: '10:30 ص' },
  { key: 'confirmed', labelAr: 'تم التأكيد', icon: '✅', time: '10:45 ص' },
  { key: 'preparing', labelAr: 'جاري التحضير', icon: '📦', time: '11:00 ص' },
  { key: 'on_the_way', labelAr: 'في الطريق', icon: '🚚' },
  { key: 'delivered', labelAr: 'تم التوصيل', icon: '🎉' },
];

// ── Helpers ─────────────────────────────────────────────────────────
function getStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

// ── Component ───────────────────────────────────────────────────────
export default function OrderTrackingScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { orderId } = route.params;
  const order = MOCK_ORDER;
  const activeIndex = getStepIndex(order.currentStatus);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center bg-white px-4 py-3" style={{ elevation: 2 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="ml-3">
          <Text className="text-lg text-text-primary">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg text-text-primary" style={{ fontFamily: FONTS.bold }}>
          {t('orderTracking.title', 'تتبع الطلب')}
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Order header */}
          <View className="mb-4 rounded-xl bg-white p-4" style={{ elevation: 2 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.bold }}>
                {order.id}
              </Text>
              <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular }}>
                {order.date}
              </Text>
            </View>
          </View>

          {/* Timeline stepper */}
          <View className="mb-4 rounded-xl bg-white p-4" style={{ elevation: 2 }}>
            <Text className="mb-4 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
              {t('orderTracking.status', 'حالة الطلب')}
            </Text>

            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= activeIndex;
              const isActive = index === activeIndex;

              return (
                <View key={step.key} className="flex-row">
                  {/* Vertical line + dot */}
                  <View className="mr-4 items-center" style={{ width: 32 }}>
                    {/* Dot */}
                    <View
                      className={`h-8 w-8 items-center justify-center rounded-full ${
                        isActive
                          ? 'bg-accent'
                          : isCompleted
                          ? 'bg-success'
                          : 'bg-border'
                      }`}
                    >
                      <Text className="text-sm">{isCompleted ? step.icon : '○'}</Text>
                    </View>
                    {/* Line */}
                    {index < STATUS_STEPS.length - 1 && (
                      <View
                        className={`w-0.5 flex-1 ${
                          index < activeIndex ? 'bg-success' : 'bg-border'
                        }`}
                        style={{ minHeight: 32 }}
                      />
                    )}
                  </View>

                  {/* Label */}
                  <View className="flex-1 pb-6">
                    <Text
                      className={`text-sm ${
                        isActive ? 'text-accent' : isCompleted ? 'text-text-primary' : 'text-text-secondary'
                      }`}
                      style={{ fontFamily: isActive ? FONTS.bold : FONTS.medium, writingDirection: 'rtl' }}
                    >
                      {step.labelAr}
                    </Text>
                    {step.time && isCompleted && (
                      <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular }}>
                        {step.time}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Order items */}
          <View className="mb-4 rounded-xl bg-white p-4" style={{ elevation: 2 }}>
            <Text className="mb-2 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
              {t('orderTracking.items', 'محتويات الطلب')}
            </Text>
            {order.items.map((item, i) => (
              <View
                key={i}
                className={`flex-row items-center justify-between py-2 ${
                  i < order.items.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <Text className="flex-1 text-sm text-text-primary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                  {item.nameAr} x{item.qty}
                </Text>
                <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold }}>
                  {item.price * item.qty} {t('common.egp', 'ج.م')}
                </Text>
              </View>
            ))}
            <View className="mt-2 flex-row justify-between border-t border-border pt-2">
              <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
                {t('cart.total', 'الإجمالي')}
              </Text>
              <Text className="text-sm text-accent" style={{ fontFamily: FONTS.bold }}>
                {order.total} {t('common.egp', 'ج.م')}
              </Text>
            </View>
          </View>

          {/* Store contact */}
          <TouchableOpacity
            className="mb-4 flex-row items-center justify-center rounded-xl bg-primary py-4"
            onPress={() => Linking.openURL(`tel:${order.store.phone}`)}
          >
            <Text className="text-base text-white" style={{ fontFamily: FONTS.bold }}>
              📞 {t('orderTracking.contactStore', 'تواصل مع المتجر')} - {order.store.nameAr}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
