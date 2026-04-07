import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';

interface AuthenticityBadgeProps {
  /** AI authenticity score between 0 and 1 */
  score: number;
  className?: string;
}

export default function AuthenticityBadge({
  score,
  className,
}: AuthenticityBadgeProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

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

  const percentage = Math.round(score * 100);

  return (
    <View
      className={className}
      style={[
        styles.container,
        { backgroundColor: bgColor, flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      <View style={[styles.scoreCircle, { borderColor: color }]}>
        <Text style={[styles.scoreText, { color, fontFamily: FONTS.bold }]}>
          {percentage}%
        </Text>
      </View>

      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color, fontFamily: FONTS.semiBold }]}>
          {t('product.aiVerified', 'تم التحقق بالذكاء الاصطناعي')}
        </Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  scoreText: {
    fontSize: 16,
  },
  labelContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 13,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
