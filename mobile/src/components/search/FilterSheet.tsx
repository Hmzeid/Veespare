import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  I18nManager,
  Switch,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Button from '@/components/common/Button';

export interface FilterValues {
  minPrice: number;
  maxPrice: number;
  conditions: ('new' | 'used' | 'refurbished')[];
  sortBy: string;
}

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  initialValues?: Partial<FilterValues>;
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'price_asc', labelAr: 'السعر: من الأقل للأعلى', labelEn: 'Price: Low to High' },
  { value: 'price_desc', labelAr: 'السعر: من الأعلى للأقل', labelEn: 'Price: High to Low' },
  { value: 'rating', labelAr: 'التقييم', labelEn: 'Rating' },
  { value: 'newest', labelAr: 'الأحدث', labelEn: 'Newest' },
];

const CONDITION_OPTIONS: { value: 'new' | 'used' | 'refurbished'; labelAr: string; labelEn: string }[] = [
  { value: 'new', labelAr: 'جديد', labelEn: 'New' },
  { value: 'used', labelAr: 'مستعمل', labelEn: 'Used' },
  { value: 'refurbished', labelAr: 'مجدد', labelEn: 'Refurbished' },
];

const DEFAULT_FILTERS: FilterValues = {
  minPrice: 0,
  maxPrice: 50000,
  conditions: [],
  sortBy: 'price_asc',
};

export default function FilterSheet({
  visible,
  onClose,
  onApply,
  initialValues,
  className,
}: FilterSheetProps) {
  const { t, i18n } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const isAr = i18n.language === 'ar';

  const [filters, setFilters] = useState<FilterValues>({
    ...DEFAULT_FILTERS,
    ...initialValues,
  });

  const toggleCondition = useCallback((condition: 'new' | 'used' | 'refurbished') => {
    setFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  }, []);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View className={className} style={styles.sheet}>
          {/* Header */}
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.title}>
              {t('filter.title', 'تصفية النتائج')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {/* Price Range */}
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('filter.priceRange', 'نطاق السعر')}
            </Text>
            <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.priceLabel}>
                {filters.minPrice.toLocaleString('ar-EG')} {t('currency', 'ج.م')}
              </Text>
              <Text style={styles.priceLabel}>—</Text>
              <Text style={styles.priceLabel}>
                {filters.maxPrice.toLocaleString('ar-EG')} {t('currency', 'ج.م')}
              </Text>
            </View>

            {/* Condition */}
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('filter.condition', 'الحالة')}
            </Text>
            {CONDITION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => toggleCondition(opt.value)}
                style={[
                  styles.checkRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    filters.conditions.includes(opt.value) && styles.checkboxActive,
                  ]}
                >
                  {filters.conditions.includes(opt.value) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkLabel}>
                  {isAr ? opt.labelAr : opt.labelEn}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Sort */}
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('filter.sortBy', 'ترتيب حسب')}
            </Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setFilters((p) => ({ ...p, sortBy: opt.value }))}
                style={[
                  styles.radioRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <View
                  style={[
                    styles.radio,
                    filters.sortBy === opt.value && styles.radioActive,
                  ]}
                />
                <Text style={styles.checkLabel}>
                  {isAr ? opt.labelAr : opt.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1, marginHorizontal: 4 }}>
              <Button
                title={t('filter.reset', 'إعادة تعيين')}
                onPress={handleReset}
                variant="outline"
                fullWidth
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: 4 }}>
              <Button
                title={t('filter.apply', 'تطبيق')}
                onPress={handleApply}
                variant="primary"
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: SPACING.lg,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    fontSize: 20,
    color: COLORS.textSecondary,
    padding: 4,
  },
  body: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
  },
  checkRow: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
  },
  radioRow: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  radioActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  footer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
