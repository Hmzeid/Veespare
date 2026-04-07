import React from 'react';
import { View, Text, StyleSheet, I18nManager, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Badge from '@/components/common/Badge';
import RatingStars from '@/components/common/RatingStars';

interface StoreEntry {
  storeId: string;
  storeName: string;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  rating: number;
  stock: number;
}

interface PriceComparisonTableProps {
  stores: StoreEntry[];
  className?: string;
}

export default function PriceComparisonTable({
  stores,
  className,
}: PriceComparisonTableProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const sorted = [...stores].sort((a, b) => a.price - b.price);

  return (
    <View className={className} style={styles.container}>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('product.priceComparison', 'مقارنة الأسعار')}
      </Text>

      {/* Header row */}
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.headerCell, styles.storeCol]}>
          {t('product.store', 'المتجر')}
        </Text>
        <Text style={[styles.headerCell, styles.priceCol]}>
          {t('product.price', 'السعر')}
        </Text>
        <Text style={[styles.headerCell, styles.conditionCol]}>
          {t('product.condition', 'الحالة')}
        </Text>
        <Text style={[styles.headerCell, styles.ratingCol]}>
          {t('product.rating', 'التقييم')}
        </Text>
        <Text style={[styles.headerCell, styles.stockCol]}>
          {t('product.stock', 'المخزون')}
        </Text>
      </View>

      <ScrollView>
        {sorted.map((store, index) => {
          const isBest = index === 0;
          return (
            <View
              key={store.storeId}
              style={[
                styles.row,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
                isBest && styles.bestRow,
                index % 2 === 1 && styles.altRow,
              ]}
            >
              <Text style={[styles.cell, styles.storeCol]} numberOfLines={1}>
                {store.storeName}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.priceCol,
                  isBest && styles.bestPrice,
                ]}
              >
                {store.price.toLocaleString('ar-EG')} {t('currency', 'ج.م')}
              </Text>
              <View style={styles.conditionCol}>
                <Badge variant="condition" condition={store.condition} />
              </View>
              <View style={styles.ratingCol}>
                <RatingStars rating={store.rating} size={10} />
              </View>
              <Text
                style={[
                  styles.cell,
                  styles.stockCol,
                  { color: store.stock > 0 ? COLORS.success : COLORS.error },
                ]}
              >
                {store.stock > 0
                  ? t('product.inStock', 'متوفر')
                  : t('product.outOfStock', 'غير متوفر')}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerRow: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  headerCell: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.textInverse,
    textAlign: 'center',
  },
  row: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  bestRow: {
    backgroundColor: '#f0fff0',
  },
  altRow: {
    backgroundColor: COLORS.surface,
  },
  cell: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  bestPrice: {
    color: COLORS.success,
    fontFamily: FONTS.bold,
  },
  storeCol: {
    flex: 2,
  },
  priceCol: {
    flex: 2,
  },
  conditionCol: {
    flex: 1.5,
    alignItems: 'center',
  },
  ratingCol: {
    flex: 1.5,
    alignItems: 'center',
  },
  stockCol: {
    flex: 1.5,
  },
});
