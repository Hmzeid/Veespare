import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, FONTS } from '@/constants/theme';

// ── Navigation types ────────────────────────────────────────────────
export type RegisterStackParamList = {
  Register: undefined;
  Login: undefined;
};

type Props = NativeStackScreenProps<RegisterStackParamList, 'Register'>;

// ── Types ───────────────────────────────────────────────────────────
interface FormData {
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface FormErrors {
  firstNameAr?: string;
  lastNameAr?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

// ── Validation ──────────────────────────────────────────────────────
function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.firstNameAr.trim()) {
    errors.firstNameAr = 'الاسم الأول مطلوب';
  }
  if (!data.lastNameAr.trim()) {
    errors.lastNameAr = 'الاسم الأخير مطلوب';
  }
  if (!data.phone.trim()) {
    errors.phone = 'رقم الهاتف مطلوب';
  } else if (!/^(01)[0-9]{9}$/.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'يرجى إدخال رقم هاتف مصري صحيح (01XXXXXXXXX)';
  }
  if (!data.email.trim()) {
    errors.email = 'البريد الإلكتروني مطلوب';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'يرجى إدخال بريد إلكتروني صحيح';
  }
  if (!data.password) {
    errors.password = 'كلمة المرور مطلوبة';
  } else if (data.password.length < 8) {
    errors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'كلمتا المرور غير متطابقتين';
  }
  if (!data.acceptTerms) {
    errors.acceptTerms = 'يجب الموافقة على الشروط والأحكام';
  }

  return errors;
}

// ── Component ───────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<FormData>({
    firstNameAr: '',
    lastNameAr: '',
    firstNameEn: '',
    lastNameEn: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (key: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleRegister = async () => {
    const formErrors = validateForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) return;

    setIsLoading(true);
    try {
      // Mock registration
      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigation.navigate('Login');
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reusable input ──────────────────────────────────────────────
  const renderInput = (
    label: string,
    key: keyof FormData,
    options?: {
      placeholder?: string;
      keyboardType?: TextInput['props']['keyboardType'];
      secure?: boolean;
      prefix?: string;
      autoCapitalize?: TextInput['props']['autoCapitalize'];
    },
  ) => (
    <View className="mb-3">
      <Text className="mb-1 text-sm text-white/80" style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}>
        {label}
      </Text>
      <View className="flex-row items-center rounded-xl bg-white/10">
        {options?.prefix && (
          <Text className="pl-3 text-sm text-white/60" style={{ fontFamily: FONTS.medium }}>
            {options.prefix}
          </Text>
        )}
        {options?.secure && (
          <TouchableOpacity
            className="px-3 py-3.5"
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text className="text-sm text-white/50">{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
        <TextInput
          className={`flex-1 px-4 py-3.5 text-sm text-white ${
            errors[key as keyof FormErrors] ? 'border border-error' : ''
          }`}
          style={{ fontFamily: FONTS.regular, textAlign: 'right', writingDirection: 'rtl' }}
          placeholder={options?.placeholder || ''}
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={formData[key] as string}
          onChangeText={(text) => updateField(key, text)}
          keyboardType={options?.keyboardType || 'default'}
          secureTextEntry={options?.secure && !showPassword}
          autoCapitalize={options?.autoCapitalize || 'none'}
          autoCorrect={false}
        />
      </View>
      {errors[key as keyof FormErrors] && (
        <Text className="mt-1 text-xs text-error" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
          {errors[key as keyof FormErrors]}
        </Text>
      )}
    </View>
  );

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 pt-4">
              {/* Header */}
              <View className="mb-6 flex-row items-center">
                <TouchableOpacity onPress={() => navigation.goBack()} className="ml-3">
                  <Text className="text-lg text-white">←</Text>
                </TouchableOpacity>
                <Text className="flex-1 text-center text-xl text-white" style={{ fontFamily: FONTS.bold }}>
                  {t('auth.register', 'إنشاء حساب')}
                </Text>
                <View className="w-8" />
              </View>

              {/* Arabic names */}
              <View className="mb-1 flex-row">
                <View className="ml-2 flex-1">
                  {renderInput(t('auth.firstName', 'الاسم الأول'), 'firstNameAr', {
                    placeholder: 'مثال: أحمد',
                    autoCapitalize: 'words',
                  })}
                </View>
                <View className="flex-1">
                  {renderInput(t('auth.lastName', 'الاسم الأخير'), 'lastNameAr', {
                    placeholder: 'مثال: محمد',
                    autoCapitalize: 'words',
                  })}
                </View>
              </View>

              {/* English names */}
              <View className="mb-1 flex-row">
                <View className="ml-2 flex-1">
                  {renderInput(t('auth.firstNameEn', 'First Name'), 'firstNameEn', {
                    placeholder: 'e.g. Ahmed',
                    autoCapitalize: 'words',
                  })}
                </View>
                <View className="flex-1">
                  {renderInput(t('auth.lastNameEn', 'Last Name'), 'lastNameEn', {
                    placeholder: 'e.g. Mohamed',
                    autoCapitalize: 'words',
                  })}
                </View>
              </View>

              {/* Phone */}
              {renderInput(t('auth.phone', 'رقم الهاتف'), 'phone', {
                placeholder: '01XXXXXXXXX',
                keyboardType: 'phone-pad',
                prefix: '+20',
              })}

              {/* Email */}
              {renderInput(t('auth.email', 'البريد الإلكتروني'), 'email', {
                placeholder: 'example@email.com',
                keyboardType: 'email-address',
              })}

              {/* Password */}
              {renderInput(t('auth.password', 'كلمة المرور'), 'password', {
                placeholder: '8 أحرف على الأقل',
                secure: true,
              })}

              {/* Confirm password */}
              {renderInput(t('auth.confirmPassword', 'تأكيد كلمة المرور'), 'confirmPassword', {
                placeholder: 'أعد إدخال كلمة المرور',
                secure: true,
              })}

              {/* Terms checkbox */}
              <TouchableOpacity
                className="mb-6 flex-row items-center"
                onPress={() => updateField('acceptTerms', !formData.acceptTerms)}
              >
                <View
                  className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
                    formData.acceptTerms ? 'border-accent bg-accent' : 'border-white/30'
                  }`}
                >
                  {formData.acceptTerms && (
                    <Text className="text-xs text-white">✓</Text>
                  )}
                </View>
                <Text className="mr-3 flex-1 text-sm text-white/80" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                  {t('auth.acceptTerms', 'أوافق على الشروط والأحكام وسياسة الخصوصية')}
                </Text>
              </TouchableOpacity>
              {errors.acceptTerms && (
                <Text className="-mt-4 mb-4 text-xs text-error" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                  {errors.acceptTerms}
                </Text>
              )}

              {/* Register button */}
              <TouchableOpacity
                className={`items-center rounded-xl py-4 ${isLoading ? 'bg-accent/70' : 'bg-accent'}`}
                activeOpacity={0.8}
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text className="text-base text-white" style={{ fontFamily: FONTS.bold }}>
                  {isLoading
                    ? t('auth.registering', 'جاري إنشاء الحساب...')
                    : t('auth.createAccount', 'إنشاء حساب')}
                </Text>
              </TouchableOpacity>

              {/* Login link */}
              <View className="mt-4 flex-row items-center justify-center">
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text className="text-sm text-accent" style={{ fontFamily: FONTS.bold }}>
                    {t('auth.login', 'تسجيل الدخول')}
                  </Text>
                </TouchableOpacity>
                <Text className="mx-1 text-sm text-white/60" style={{ fontFamily: FONTS.regular }}>
                  {t('auth.hasAccount', 'لديك حساب بالفعل؟')}
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
