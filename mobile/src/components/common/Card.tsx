import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '@/constants/theme';

type ShadowSize = 'sm' | 'md' | 'lg' | 'none';
type PaddingSize = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  shadow?: ShadowSize;
  borderRadius?: keyof typeof BORDER_RADIUS;
  padding?: PaddingSize;
  style?: ViewStyle;
  className?: string;
}

const paddingMap: Record<PaddingSize, number> = {
  none: 0,
  sm: SPACING.sm,
  md: SPACING.md,
  lg: SPACING.lg,
};

export default function Card({
  children,
  shadow = 'md',
  borderRadius = 'lg',
  padding = 'md',
  style,
  className,
}: CardProps) {
  const shadowStyle = shadow !== 'none' ? SHADOWS[shadow] : {};

  return (
    <View
      className={className}
      style={[
        styles.base,
        shadowStyle,
        {
          borderRadius: BORDER_RADIUS[borderRadius],
          padding: paddingMap[padding],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
});
