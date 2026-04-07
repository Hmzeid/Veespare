import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import Badge from '@/components/common/Badge';
import RatingStars from '@/components/common/RatingStars';

interface ProductCardProps {
  id: string;
  image: string;
  nameAr: string;
  nameEn: string;
  price: number;
  condition: 'new' | 'used' | 'refurbished';
  storeName: string;
  rating: number;
  aiScore?: number;
  layout?: 'grid' | 'list';
  className?: string;
}

export default function ProductCard({
  id,
  image,
  nameAr,
  nameEn,
  price,
  condition,
  storeName,
  rating,
  aiScore,
  layout = 'grid',
  className,
}: ProductCardProps) {
  const { i18n, t } = useTranslation();
  const navigation = useNavigation<any>();
  const isRTL = I18nManager.isRTL;
  const isAr = i18n.language === 'ar';
  const name = isAr ? nameAr : nameEn;

  const handlePress = () => {
    navigation.navigate('ProductDetail', { productId: id });
  };

  if (layout === 'list') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        className={className}
        style={[styles.listCard, SHADOWS.sm, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        <Image source={{ uri: image }} style={styles.listImage} resizeMode="cover" />
        <View style={styles.listContent}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Badge variant="condition" condition={condition} />
            {aiScore !== undefined && (
              <View style={{ marginHorizontal: 4 }}>
                <Badge variant="aiScore" score={aiScore} />
              </View>
            )}
          </View>
          <Text style={styles.store}>{storeName}</Text>
          <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.price}>
              {price.toLocaleString('ar-EG')} {t('currency', 'ج.م')}
            </Text>
            <RatingStars rating={rating} size={12} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid layout
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className={className}
      style={[styles.gridCard, SHADOWS.sm]}
    >
      <Image source={{ uri: image }} style={styles.gridImage} resizeMode="cover" />
      <View style={styles.gridContent}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Badge variant="condition" condition={condition} />
          {aiScore !== undefined && (
            <View style={{ marginHorizontal: 4 }}>
              <Badge variant="aiScore" score={aiScore} />
            </View>
          )}
        </View>
        <Text style={styles.store} numberOfLines={1}>{storeName}</Text>
        <RatingStars rating={rating} size={12} />
        <Text style={styles.price}>
          {price.toLocaleString('ar-EG')} {t('currency', 'ج.م')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid
  gridCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    flex: 1,
    margin: SPACING.xs,
  },
  gridImage: {
    width: '100%',
    height: 120,
  },
  gridContent: {
    padding: SPACING.sm,
    gap: 4,
  },

  // List
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  listImage: {
    width: 110,
    height: 110,
  },
  listContent: {
    flex: 1,
    padding: SPACING.sm,
    gap: 4,
  },

  // Shared
  name: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontFamily: FONTS.semiBold,
  },
  store: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  price: {
    fontSize: 15,
    color: COLORS.accent,
    fontFamily: FONTS.bold,
  },
  row: {
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
});
