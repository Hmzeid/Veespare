import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'completed'
  | 'cancelled';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'on_the_way',
  'delivered',
  'completed',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  preparing: 'جاري التحضير',
  on_the_way: 'في الطريق',
  delivered: 'تم التوصيل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export default function OrderStatusTimeline({
  currentStatus,
  className,
}: OrderStatusTimelineProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  if (currentStatus === 'cancelled') {
    return (
      <View className={className} style={styles.container}>
        <View style={[styles.step, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.dot, { backgroundColor: COLORS.error }]} />
          <Text style={[styles.label, { color: COLORS.error, fontFamily: FONTS.bold }]}>
            {t('order.status.cancelled', STATUS_LABELS.cancelled)}
          </Text>
        </View>
      </View>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(currentStatus);

  return (
    <View className={className} style={styles.container}>
      {STATUS_FLOW.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isFuture = index > currentIndex;

        const dotColor = isCompleted
          ? COLORS.success
          : isActive
            ? COLORS.accent
            : COLORS.surfaceDark;

        const textColor = isCompleted
          ? COLORS.success
          : isActive
            ? COLORS.accent
            : COLORS.textSecondary;

        const lineColor = isCompleted ? COLORS.success : COLORS.surfaceDark;

        return (
          <View key={status}>
            <View style={[styles.step, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.dotColumn}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: dotColor },
                    isActive && styles.activeDot,
                  ]}
                />
                {index < STATUS_FLOW.length - 1 && (
                  <View style={[styles.line, { backgroundColor: lineColor }]} />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: textColor,
                    fontFamily: isActive ? FONTS.bold : FONTS.regular,
                  },
                ]}
              >
                {t(`order.status.${status}`, STATUS_LABELS[status])}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  step: {
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  dotColumn: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  activeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  line: {
    width: 2,
    height: 28,
  },
  label: {
    fontSize: 14,
    marginTop: -2,
    paddingBottom: SPACING.xs,
  },
});
