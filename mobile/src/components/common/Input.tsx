import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  I18nManager,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, BORDER_RADIUS, SPACING } from '@/constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  secureTextEntry?: boolean;
  className?: string;
}

export default function Input({
  label,
  error,
  iconLeft,
  iconRight,
  secureTextEntry = false,
  className,
  placeholder,
  ...rest
}: InputProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const [focused, setFocused] = useState(false);
  const [hideText, setHideText] = useState(secureTextEntry);

  const borderColor = error
    ? COLORS.error
    : focused
      ? COLORS.accent
      : COLORS.border;

  return (
    <View className={className} style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              textAlign: isRTL ? 'right' : 'left',
              fontFamily: FONTS.medium,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        {iconLeft && <View style={styles.icon}>{iconLeft}</View>}

        <TextInput
          {...rest}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={hideText}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
              fontFamily: FONTS.regular,
            },
          ]}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setHideText((v) => !v)}
            style={styles.icon}
          >
            <Text style={{ fontSize: 16 }}>{hideText ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}

        {iconRight && !secureTextEntry && (
          <View style={styles.icon}>{iconRight}</View>
        )}
      </View>

      {error && (
        <Text
          style={[
            styles.error,
            { textAlign: isRTL ? 'right' : 'left', fontFamily: FONTS.regular },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: SPACING.sm,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  icon: {
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  error: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
