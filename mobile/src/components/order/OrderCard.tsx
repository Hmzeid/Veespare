import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import Badge from '@/components/common/Badge';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'completed'
  | 'cancelled';

interface OrderCardProps {
  id: string;
  orderNumber: string;
  storeName: string;
  total: number;
  status: OrderStatus;
  date: string;
  itemCount: number;
  className?: string;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  preparing: 'جاري التحضير',
  on_the_way: 'في الطريق',
  delivered: 'تم التوصيل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#fff3cd', text: '#856404' },
  confirmed: { bg: '#cce5ff', text: '#004085' },
  preparing: { bg: '#d1ecf1', text: '#0c5460' },
  on_the_way: { bg: '#fff3cd', text: '#856404' },
  delivered: { bg: '#d4edda', text: '#155724' },
  completed: { bg: '#d4edda', text: '#155724' },
  cancelled: { bg: '#f8d7da', text: '#721c24' },
};

export default function OrderCard({
  id,
  orderNumber,
  storeName,
  total,
  status,
  date,
  itemCount,
  className,
}: OrderCardProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const isRTL = I18nManager.isRTL;

  const statusColor = STATUS_COLORS[status];

  const handlePress = () => {
    navigation.navigate('OrderTracking', { orderId: id });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className={className}
      style={[styles.card, SHADOWS.sm]}
    >
      {/* Top row: order number + status */}
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.orderNumber}>#{orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {t(`order.status.${status}`, STATUS_LABELS[status])}
          </Text>
        </View>
      </View>

      {/* Store name */}
      <Text style={[styles.storeName, { textAlign: isRTL ? 'right' : 'left' }]}>
        {storeName}
      </Text>

      {/* Bottom row: total, items, date */}
      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.total}>
          {total.toLocaleString('ar-EG')} {t('currency', 'ج.م')}
        </Text>
        <Text style={styles.meta}>
          {itemCount} {t('order.items', 'قطع')} · {date}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  storeName: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  total: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.accent,
  },
  meta: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});
