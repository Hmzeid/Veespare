import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '@/constants/theme';

type BadgeVariant = 'condition' | 'rating' | 'verified' | 'aiScore';

interface BadgeProps {
  variant: BadgeVariant;
  /** Required for condition variant: 'new' | 'used' | 'refurbished' */
  condition?: 'new' | 'used' | 'refurbished';
  /** Rating value for rating variant */
  rating?: number;
  /** AI authenticity score 0-1 for aiScore variant */
  score?: number;
  className?: string;
}

const conditionColors: Record<string, { bg: string; text: string }> = {
  new: { bg: '#d4edda', text: '#155724' },
  used: { bg: '#fff3cd', text: '#856404' },
  refurbished: { bg: '#cce5ff', text: '#004085' },
};

const conditionLabels: Record<string, string> = {
  new: 'جديد',
  used: 'مستعمل',
  refurbished: 'مجدد',
};

export default function Badge({
  variant,
  condition,
  rating,
  score,
  className,
}: BadgeProps) {
  const { t } = useTranslation();

  if (variant === 'condition' && condition) {
    const colors = conditionColors[condition] ?? conditionColors.used;
    return (
      <View className={className} style={[styles.badge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.text, { color: colors.text, fontFamily: FONTS.semiBold }]}>
          {t(`condition.${condition}`, conditionLabels[condition])}
        </Text>
      </View>
    );
  }

  if (variant === 'rating' && rating !== undefined) {
    return (
      <View className={className} style={[styles.badge, { backgroundColor: '#fff3cd' }]}>
        <Text style={[styles.text, { color: '#856404', fontFamily: FONTS.semiBold }]}>
          {'★ '}{rating.toFixed(1)}
        </Text>
      </View>
    );
  }

  if (variant === 'verified') {
    return (
      <View className={className} style={[styles.badge, { backgroundColor: '#d4edda' }]}>
        <Text style={[styles.text, { color: '#155724', fontFamily: FONTS.semiBold }]}>
          ✓ {t('badge.verified', 'موثق')}
        </Text>
      </View>
    );
  }

  if (variant === 'aiScore' && score !== undefined) {
    const color =
      score > 0.8
        ? COLORS.success
        : score >= 0.5
          ? COLORS.warning
          : COLORS.error;
    const bgColor =
      score > 0.8
        ? '#d4edda'
        : score >= 0.5
          ? '#fff3cd'
          : '#f8d7da';

    return (
      <View className={className} style={[styles.badge, { backgroundColor: bgColor }]}>
        <Text style={[styles.text, { color, fontFamily: FONTS.semiBold }]}>
          🤖 {Math.round(score * 100)}%
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
  },
});
