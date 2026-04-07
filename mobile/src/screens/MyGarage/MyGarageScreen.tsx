import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '@/constants/theme';

// ── Navigation types ────────────────────────────────────────────────
export type MyGarageStackParamList = {
  MyGarage: undefined;
  ProductDetail: { productId: string };
};

type Props = NativeStackScreenProps<MyGarageStackParamList, 'MyGarage'>;

// ── Types ───────────────────────────────────────────────────────────
interface UserCar {
  id: string;
  makeAr: string;
  modelAr: string;
  year: number;
  plateNumber?: string;
  maintenanceCount: number;
  lastMaintenance?: string;
}

interface MaintenanceEntry {
  id: string;
  titleAr: string;
  date: string;
  cost: number;
  mileage: number;
}

interface RecommendedPart {
  id: string;
  nameAr: string;
  price: number;
  reason: string;
}

// ── Mock data ───────────────────────────────────────────────────────
const MOCK_CARS: UserCar[] = [
  {
    id: 'car1',
    makeAr: 'تويوتا',
    modelAr: 'كورولا',
    year: 2020,
    plateNumber: 'أ ب ج 1234',
    maintenanceCount: 5,
    lastMaintenance: '2024-01-10',
  },
  {
    id: 'car2',
    makeAr: 'هيونداي',
    modelAr: 'أكسنت',
    year: 2019,
    plateNumber: 'د هـ و 5678',
    maintenanceCount: 3,
    lastMaintenance: '2023-12-20',
  },
];

const MOCK_MAINTENANCE: Record<string, MaintenanceEntry[]> = {
  car1: [
    { id: 'm1', titleAr: 'تغيير زيت المحرك', date: '2024-01-10', cost: 450, mileage: 45000 },
    { id: 'm2', titleAr: 'تغيير تيل الفرامل', date: '2023-10-05', cost: 800, mileage: 40000 },
    { id: 'm3', titleAr: 'تغيير فلتر هواء', date: '2023-07-15', cost: 200, mileage: 35000 },
  ],
  car2: [
    { id: 'm4', titleAr: 'تغيير زيت المحرك', date: '2023-12-20', cost: 400, mileage: 60000 },
    { id: 'm5', titleAr: 'تغيير بطارية', date: '2023-09-01', cost: 2500, mileage: 55000 },
  ],
};

const RECOMMENDED_PARTS: RecommendedPart[] = [
  { id: 'r1', nameAr: 'فلتر زيت تويوتا كورولا', price: 250, reason: 'آخر تغيير منذ 6 أشهر' },
  { id: 'r2', nameAr: 'فلتر هواء تويوتا كورولا', price: 180, reason: 'موصى بالتغيير كل 10,000 كم' },
  { id: 'r3', nameAr: 'شمعات إشعال تويوتا', price: 320, reason: 'صيانة وقائية' },
];

// ── Component ───────────────────────────────────────────────────────
export default function MyGarageScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [selectedCarId, setSelectedCarId] = useState<string>(MOCK_CARS[0]?.id || '');
  const [showAddCar, setShowAddCar] = useState(false);

  const selectedCar = MOCK_CARS.find((c) => c.id === selectedCarId);
  const maintenance = MOCK_MAINTENANCE[selectedCarId] || [];

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-primary px-4 py-4">
        <Text className="text-xl text-white" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
          {t('garage.title', 'كراجي')}
        </Text>
        <TouchableOpacity
          className="rounded-lg bg-accent px-4 py-2"
          onPress={() => setShowAddCar(true)}
        >
          <Text className="text-sm text-white" style={{ fontFamily: FONTS.medium }}>
            + {t('garage.addCar', 'إضافة سيارة')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cars list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-4">
          {MOCK_CARS.map((car) => (
            <TouchableOpacity
              key={car.id}
              className={`mr-3 rounded-xl p-4 ${
                selectedCarId === car.id ? 'bg-accent' : 'bg-white'
              }`}
              style={{ width: 180, elevation: 2 }}
              onPress={() => setSelectedCarId(car.id)}
            >
              <Text className="mb-1 text-3xl text-center">🚗</Text>
              <Text
                className={`text-center text-sm ${
                  selectedCarId === car.id ? 'text-white' : 'text-text-primary'
                }`}
                style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
              >
                {car.makeAr} {car.modelAr}
              </Text>
              <Text
                className={`text-center text-xs ${
                  selectedCarId === car.id ? 'text-white/70' : 'text-text-secondary'
                }`}
                style={{ fontFamily: FONTS.regular }}
              >
                {car.year} {car.plateNumber ? `· ${car.plateNumber}` : ''}
              </Text>
              <View className="mt-2 flex-row items-center justify-center">
                <Text
                  className={`text-xs ${
                    selectedCarId === car.id ? 'text-white/70' : 'text-text-secondary'
                  }`}
                  style={{ fontFamily: FONTS.regular }}
                >
                  🔧 {car.maintenanceCount} {t('garage.maintenanceRecords', 'سجلات')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Add car placeholder */}
          <TouchableOpacity
            className="mr-3 items-center justify-center rounded-xl border-2 border-dashed border-border bg-white"
            style={{ width: 180 }}
            onPress={() => setShowAddCar(true)}
          >
            <Text className="mb-1 text-3xl text-text-secondary">+</Text>
            <Text className="text-sm text-text-secondary" style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}>
              {t('garage.addCar', 'إضافة سيارة')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {selectedCar && (
          <>
            {/* Maintenance timeline */}
            <View className="px-4 pb-4">
              <Text className="mb-3 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
                {t('garage.maintenanceHistory', 'سجل الصيانة')} - {selectedCar.makeAr} {selectedCar.modelAr}
              </Text>

              {maintenance.length > 0 ? (
                maintenance.map((entry, index) => (
                  <View key={entry.id} className="flex-row">
                    {/* Timeline line + dot */}
                    <View className="mr-4 items-center" style={{ width: 24 }}>
                      <View className="h-4 w-4 rounded-full bg-accent" />
                      {index < maintenance.length - 1 && (
                        <View className="w-0.5 flex-1 bg-border" style={{ minHeight: 48 }} />
                      )}
                    </View>

                    {/* Entry card */}
                    <View className="mb-3 flex-1 rounded-xl bg-white p-3" style={{ elevation: 1 }}>
                      <Text className="mb-1 text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }}>
                        {entry.titleAr}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-text-secondary" style={{ fontFamily: FONTS.regular }}>
                          {entry.date}
                        </Text>
                        <Text className="text-xs text-accent" style={{ fontFamily: FONTS.bold }}>
                          {entry.cost} {t('common.egp', 'ج.م')}
                        </Text>
                      </View>
                      <Text className="mt-1 text-xs text-text-secondary" style={{ fontFamily: FONTS.regular }}>
                        {entry.mileage.toLocaleString()} {t('garage.km', 'كم')}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="items-center rounded-xl bg-white py-8" style={{ elevation: 1 }}>
                  <Text className="mb-1 text-3xl">📋</Text>
                  <Text className="text-sm text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                    {t('garage.noMaintenance', 'لا توجد سجلات صيانة')}
                  </Text>
                </View>
              )}
            </View>

            {/* Recommended parts */}
            <View className="px-4 pb-8">
              <Text className="mb-3 text-base text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
                {t('garage.recommendedParts', 'قطع موصى بها لسيارتك')}
              </Text>
              {RECOMMENDED_PARTS.map((part) => (
                <TouchableOpacity
                  key={part.id}
                  className="mb-3 flex-row items-center rounded-xl bg-white p-3"
                  style={{ elevation: 1 }}
                  onPress={() => navigation.navigate('ProductDetail', { productId: part.id })}
                >
                  <View className="ml-3 h-14 w-14 items-center justify-center rounded-lg bg-surface">
                    <Text className="text-2xl">🔧</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 text-sm text-text-primary" style={{ fontFamily: FONTS.semiBold, writingDirection: 'rtl' }}>
                      {part.nameAr}
                    </Text>
                    <Text className="text-xs text-gold" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                      💡 {part.reason}
                    </Text>
                  </View>
                  <Text className="text-sm text-accent" style={{ fontFamily: FONTS.bold }}>
                    {part.price} {t('common.egp', 'ج.م')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {MOCK_CARS.length === 0 && (
          <View className="flex-1 items-center justify-center py-20 px-8">
            <Text className="mb-4 text-6xl">🚗</Text>
            <Text className="mb-2 text-xl text-text-primary" style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}>
              {t('garage.empty', 'لم تضف سيارات بعد')}
            </Text>
            <Text className="mb-6 text-center text-sm text-text-secondary" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
              {t('garage.emptyMessage', 'أضف سيارتك للحصول على توصيات قطع الغيار')}
            </Text>
            <TouchableOpacity className="rounded-xl bg-accent px-8 py-3" onPress={() => setShowAddCar(true)}>
              <Text className="text-base text-white" style={{ fontFamily: FONTS.bold }}>
                {t('garage.addCar', 'إضافة سيارة')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
