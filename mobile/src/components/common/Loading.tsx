import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
  className?: string;
}

export default function Loading({
  text,
  fullScreen = false,
  size = 'large',
  className,
}: LoadingProps) {
  const { t } = useTranslation();
  const displayText = text ?? t('common.loading', 'جار التحميل...');

  const content = (
    <View
      className={className}
      style={[styles.container, fullScreen && styles.fullScreen]}
    >
      <ActivityIndicator size={size} color={COLORS.accent} />
      {displayText ? (
        <Text style={styles.text}>{displayText}</Text>
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <Modal transparent animationType="fade" visible>
        <View style={styles.overlay}>{content}</View>
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  fullScreen: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});
