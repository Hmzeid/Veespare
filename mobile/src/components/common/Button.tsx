import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  I18nManager,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
}

const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 13 },
  md: { paddingVertical: 10, paddingHorizontal: 20, fontSize: 15 },
  lg: { paddingVertical: 14, paddingHorizontal: 28, fontSize: 17 },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
}: ButtonProps) {
  const isRTL = I18nManager.isRTL;
  const sizeConfig = sizeStyles[size];

  const getBackgroundColor = () => {
    if (disabled) return COLORS.surfaceDark;
    switch (variant) {
      case 'primary':
        return COLORS.accent;
      case 'secondary':
        return COLORS.primary;
      case 'outline':
      case 'ghost':
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textSecondary;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return COLORS.white;
      case 'outline':
        return COLORS.accent;
      case 'ghost':
        return COLORS.textPrimary;
    }
  };

  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1.5,
        borderColor: disabled ? COLORS.border : COLORS.accent,
      };
    }
    return {};
  };

  const resolvedIconPosition = isRTL
    ? iconPosition === 'left'
      ? 'right'
      : 'left'
    : iconPosition;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={className}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          width: fullWidth ? '100%' : undefined,
          alignSelf: fullWidth ? 'stretch' : 'center',
        },
        getBorderStyle(),
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View
          style={[
            styles.content,
            { flexDirection: resolvedIconPosition === 'left' ? 'row' : 'row-reverse' },
          ]}
        >
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text
            style={[
              styles.label,
              {
                color: getTextColor(),
                fontSize: sizeConfig.fontSize,
                fontFamily: FONTS.semiBold,
              },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginHorizontal: 6,
  },
  label: {
    textAlign: 'center',
  },
});
