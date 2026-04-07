import { create } from 'zustand';
import { I18nManager } from 'react-native';
import i18n, { applyRTL } from '@/i18n';

export interface SelectedCar {
  make: string;
  model: string;
  year: number;
}

interface AppState {
  language: 'ar' | 'en';
  selectedCar: SelectedCar | null;
  isRTL: boolean;
  setLanguage: (language: 'ar' | 'en') => void;
  setSelectedCar: (car: SelectedCar | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'ar',
  selectedCar: null,
  isRTL: I18nManager.isRTL,

  setLanguage: (language) => {
    i18n.changeLanguage(language);
    applyRTL(language);
    set({ language, isRTL: language === 'ar' });
  },

  setSelectedCar: (car) => {
    set({ selectedCar: car });
  },
}));
