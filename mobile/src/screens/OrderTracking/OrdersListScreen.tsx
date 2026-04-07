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
export type OrdersListStackParamList = {
  OrdersList: undefined;
  OrderTracking: { orderId: string };
};

type Props = NativeStackScreenProps<OrdersListStackParamList, 'OrdersList'>;

// ── Types ───────────────────────────────────────────────────────────
type OrderStatusGroup = 'active' | 'completed' | 'cancelled';
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  storeNameAr: string;
  total: number;
  status: OrderStatus;
  statusGroup: OrderStatusGroup;
  date: string;
  itemCount: number;
}

// ── Mock data ───────────────────────────────────────────────────────
const MOCK_ORDERS: Order[] = [
  { id: 'ORD-2024-005', storeNameAr: 'قطع غيار النيل', total: 1030, status: 'preparing', statusGroup: 'active', date: '2024-01-20', itemCount: 3 },
  { id: 'ORD-2024-004', storeNameAr: 'أوتو بارتس مصر', total: 480, status: 'on_the_way', statusGroup: 'active', date: '2024-01-19', itemCount: 1 },
  { id: 'ORD-2024-003', storeNameAr: 'الشرق للقطع', total: 3500, status: 'delivered', statusGroup: 'completed', date: '2024-01-15', itemCount: 2 },
  { id: 'ORD-2024-002', storeNameAr: 'قطع غيار النيل', total: 750, status: 'delivered', statusGroup: 'completed', date: '2024-01-10', itemCount: 4 },
  { id: 'ORD-2024-001', storeNameAr: 'أوتو بارتس مصر', total: 200, status: 'cancelled', statusGroup: 'cancelled', date: '2024-01-05', itemCount: 1 },
];

const TABS: { key: OrderStatusGroup; labelAr: string }[] = [
  { key: 'active', labelAr: 'نشطة' },
  { key: 'completed', labelAr: 'مكتملة' },
  { key: 'cancelled', labelAr: 'ملغاة' },
];

// ── Helpers ─────────────────────────────────────────────────────────
function statusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: 'في الانتظار',
    confirmed: 'تم التأكيد',
    preparing: 'جاري التحضير',
    on_the_way: 'في الطريق',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
  };
  return map[status];
}

function statusBadgeColor(status: OrderStatus): string {
  switch (status) {
    case 'pending': return 'bg-warning';
    case 'confirmed': return 'bg-info';
    case 'preparing': return 'bg-gold';
    case 'on_the_way': return 'bg-accent';
    case 'delivered': return 'bg-success';
    case 'cancelled': return 'bg-error';
    default: return 'bg-text-secondary';
  }
}

// ── Component ───────────────────────────────────────────────────────
export default function OrdersListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<OrderStatusGroup>('active');

  const filteredOrders = MOCK_ORDERS.filter((o) => o.statusGroup === activeTab);

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      className="mb-3 rounded-xl bg-white p-4"
      style={{ elevation: 2 }}
      onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
    >
      {/* Top row: order ID + status */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm text-text-primary" style={{ fontFamily: FONTS.bold }}>
          {item.id}
        </Text>
        <View className={`rounded-full px-3 py-1 ${statusBadgeColor(item.status)}`}>
          <Text className="text-xs text-white" style={{ fontFamily: FONTS.medium }}>
            {statusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Store + date */}
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
          {item.storeNameAr}
        </Text>
        <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular }}>
          {item.date}
        </Text>
      </View>

      {/* Bottom: items count + total */}
      <View className="flex-row items-center justify-between border-t border-border pt-2">
        <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
          {item.itemCount} {t('orders.items', 'قطع')}
        </Text>
        <Text className="text-base text-accent" style={{ fontFamily: FONTS.bold }}>
          {item.total} {t('common.egp', 'ج.م')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-white px-4 py-3" style={{ elevation: 2 }}>
        <Text className="text-center text-lg text-text-primary" style={{ fontFamily: FONTS.bold }}>
          {t('orders.title', 'طلباتي')}
        </Text>
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

      {/* Orders list */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="mb-2 text-4xl">📦</Text>
            <Text className="text-sm text-text-secondary" style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}>
              {t('orders.noOrders', 'لا توجد طلبات')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
