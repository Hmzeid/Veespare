import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

interface CategoryCardProps {
  icon: string;
  nameAr: string;
  nameEn: string;
  onPress: () => void;
  className?: string;
}

export default function CategoryCard({
  icon,
  nameAr,
  nameEn,
  onPress,
  className,
}: CategoryCardProps) {
  const { i18n } = useTranslation();
  const name = i18n.language === 'ar' ? nameAr : nameEn;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={className}
      style={[styles.card, SHADOWS.sm]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    marginHorizontal: SPACING.xs,
  },
  iconContainer: {
    marginBottom: SPACING.xs,
  },
  icon: {
    fontSize: 28,
  },
  name: {
    fontSize: 11,
    color: COLORS.textInverse,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
});
