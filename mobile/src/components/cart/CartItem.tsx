import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { useCartStore } from '@/store/cartStore';

interface CartItemProps {
  storeProductId: string;
  image: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  className?: string;
}

export default function CartItem({
  storeProductId,
  image,
  nameAr,
  nameEn,
  price,
  quantity,
  className,
}: CartItemProps) {
  const { t, i18n } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const isAr = i18n.language === 'ar';
  const name = isAr ? nameAr : nameEn;
  const lineTotal = price * quantity;

  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <View
      className={className}
      style={[styles.container, SHADOWS.sm, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
    >
      <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>

        <Text style={styles.unitPrice}>
          {price.toLocaleString('ar-EG')} {t('currency', 'ج.م')}
        </Text>

        {/* Quantity stepper */}
        <View style={[styles.stepper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            onPress={() => updateQuantity(storeProductId, quantity - 1)}
            style={styles.stepBtn}
          >
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qty}>{quantity}</Text>

          <TouchableOpacity
            onPress={() => updateQuantity(storeProductId, quantity + 1)}
            style={styles.stepBtn}
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.total}>
            {lineTotal.toLocaleString('ar-EG')} {t('currency', 'ج.م')}
          </Text>
          <TouchableOpacity onPress={() => removeItem(storeProductId)}>
            <Text style={styles.remove}>{t('cart.remove', 'حذف')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  image: {
    width: 90,
    height: '100%',
    minHeight: 100,
  },
  content: {
    flex: 1,
    padding: SPACING.sm,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  unitPrice: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  stepper: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 0,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  qty: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  footer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  total: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.accent,
  },
  remove: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.error,
  },
});
