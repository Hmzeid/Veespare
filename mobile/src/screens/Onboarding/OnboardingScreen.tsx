import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '@/constants/theme';

// ── Navigation types ────────────────────────────────────────────────
export type OnboardingStackParamList = {
  Onboarding: undefined;
};

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Onboarding'>;

// ── Slide data ──────────────────────────────────────────────────────
interface Slide {
  id: string;
  titleAr: string;
  descriptionAr: string;
  icon: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    titleAr: 'أكبر سوق لقطع غيار السيارات في مصر',
    descriptionAr: 'آلاف القطع الأصلية والبديلة من أفضل المتاجر',
    icon: '🔧',
  },
  {
    id: '2',
    titleAr: 'مقارنة الأسعار بذكاء',
    descriptionAr: 'قارن الأسعار من عدة متاجر واحصل على أفضل عرض',
    icon: '💰',
  },
  {
    id: '3',
    titleAr: 'كشف القطع المغشوشة بالذكاء الاصطناعي',
    descriptionAr: 'تقنية ذكية تحمي سيارتك من القطع المقلدة',
    icon: '🛡️',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Component ───────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    // Navigate to auth or main app
    (navigation as any).replace('Login');
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View className="items-center justify-center px-8" style={{ width: SCREEN_WIDTH }}>
      {/* Illustration placeholder */}
      <View className="mb-8 h-56 w-56 items-center justify-center rounded-full bg-white/10">
        <Text style={{ fontSize: 80 }}>{item.icon}</Text>
      </View>

      <Text
        className="mb-4 text-center text-2xl leading-10 text-white"
        style={{ fontFamily: FONTS.bold, writingDirection: 'rtl' }}
      >
        {item.titleAr}
      </Text>

      <Text
        className="text-center text-base leading-7 text-white/70"
        style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}
      >
        {item.descriptionAr}
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryLight]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Skip button */}
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity
            className="absolute right-5 top-14 z-10 px-4 py-2"
            onPress={handleGetStarted}
          >
            <Text
              className="text-sm text-white/60"
              style={{ fontFamily: FONTS.medium }}
            >
              {t('onboarding.skip', 'تخطي')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <View className="flex-1 justify-center">
          <FlatList
            ref={flatListRef}
            data={SLIDES}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            inverted={I18nManager.isRTL}
          />
        </View>

        {/* Pagination + button */}
        <View className="items-center pb-10">
          {/* Dot indicators */}
          <View className="mb-8 flex-row items-center">
            {SLIDES.map((_, index) => (
              <View
                key={index}
                className={`mx-1 rounded-full ${
                  index === currentIndex
                    ? 'h-3 w-8 bg-accent'
                    : 'h-3 w-3 bg-white/30'
                }`}
              />
            ))}
          </View>

          {/* CTA button */}
          <TouchableOpacity
            className="mx-8 w-4/5 items-center rounded-xl bg-accent py-4"
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text
              className="text-lg text-white"
              style={{ fontFamily: FONTS.bold }}
            >
              {currentIndex === SLIDES.length - 1
                ? t('onboarding.getStarted', 'ابدأ الآن')
                : t('onboarding.next', 'التالي')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
