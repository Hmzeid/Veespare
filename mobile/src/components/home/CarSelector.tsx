import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useCarMakes, useCarModels, useCarYears } from '@/hooks/useCars';
import { useAppStore } from '@/store/appStore';

interface CarSelectorProps {
  className?: string;
}

export default function CarSelector({ className }: CarSelectorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const setSelectedCar = useAppStore((s) => s.setSelectedCar);

  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [year, setYear] = useState<number | null>(null);

  const { data: makes = [] } = useCarMakes();
  const { data: models = [] } = useCarModels(makeId);
  const { data: years = [] } = useCarYears(makeId, modelId);

  const isAr = i18n.language === 'ar';

  const handleMakeChange = useCallback(
    (value: string) => {
      setMakeId(value);
      setModelId('');
      setYear(null);
      setSelectedCar(null);
    },
    [setSelectedCar],
  );

  const handleModelChange = useCallback(
    (value: string) => {
      setModelId(value);
      setYear(null);
      setSelectedCar(null);
    },
    [setSelectedCar],
  );

  const handleYearChange = useCallback(
    (value: number | null) => {
      setYear(value);
      if (value && makeId && modelId) {
        const make = makes.find((m) => m.id === makeId);
        const model = models.find((m) => m.id === modelId);
        if (make && model) {
          setSelectedCar({
            make: isAr ? make.nameAr : make.name,
            model: isAr ? model.nameAr : model.name,
            year: value,
          });
        }
      } else {
        setSelectedCar(null);
      }
    },
    [makeId, modelId, makes, models, isAr, setSelectedCar],
  );

  const renderLabel = (text: string) => (
    <Text
      style={[
        styles.label,
        { textAlign: isRTL ? 'right' : 'left', fontFamily: FONTS.medium },
      ]}
    >
      {text}
    </Text>
  );

  return (
    <View className={className} style={styles.container}>
      {/* Make */}
      {renderLabel(t('car.make', 'الشركة المصنعة'))}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={makeId}
          onValueChange={handleMakeChange}
          style={styles.picker}
        >
          <Picker.Item
            label={t('car.selectMake', 'اختر الشركة المصنعة')}
            value=""
          />
          {makes.map((m) => (
            <Picker.Item
              key={m.id}
              label={isAr ? m.nameAr : m.name}
              value={m.id}
            />
          ))}
        </Picker>
      </View>

      {/* Model */}
      {renderLabel(t('car.model', 'الموديل'))}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={modelId}
          onValueChange={handleModelChange}
          enabled={!!makeId}
          style={[styles.picker, !makeId && styles.disabled]}
        >
          <Picker.Item
            label={t('car.selectModel', 'اختر الموديل')}
            value=""
          />
          {models.map((m) => (
            <Picker.Item
              key={m.id}
              label={isAr ? m.nameAr : m.name}
              value={m.id}
            />
          ))}
        </Picker>
      </View>

      {/* Year */}
      {renderLabel(t('car.year', 'سنة الصنع'))}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={year}
          onValueChange={(v) => handleYearChange(v ? Number(v) : null)}
          enabled={!!modelId}
          style={[styles.picker, !modelId && styles.disabled]}
        >
          <Picker.Item
            label={t('car.selectYear', 'اختر سنة الصنع')}
            value={null}
          />
          {years.map((y) => (
            <Picker.Item key={y} label={String(y)} value={y} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  label: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    fontFamily: FONTS.regular,
  },
  disabled: {
    opacity: 0.5,
  },
});
