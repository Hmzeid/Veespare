import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
}

export default function RatingStars({
  rating,
  count,
  size = 16,
  className,
}: RatingStarsProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i + 1 <= Math.floor(rating);
    const half = !filled && i < rating;
    return filled ? '★' : half ? '★' : '☆';
  });

  return (
    <View
      className={className}
      style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
    >
      <Text style={{ fontSize: size, color: COLORS.gold, letterSpacing: 1 }}>
        {stars.join('')}
      </Text>
      {count !== undefined && (
        <Text style={[styles.count, { fontFamily: FONTS.regular }]}>
          ({count})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  count: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.xs,
  },
});
