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
import { useAuthStore } from '@/store/authStore';

// ── Navigation types ────────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// ── Validation ──────────────────────────────────────────────────────
interface FormErrors {
  emailOrPhone?: string;
  password?: string;
}

function validateForm(emailOrPhone: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!emailOrPhone.trim()) {
    errors.emailOrPhone = 'البريد الإلكتروني أو رقم الهاتف مطلوب';
  } else if (
    !emailOrPhone.includes('@') &&
    !/^(\+20|0)1[0-9]{9}$/.test(emailOrPhone.replace(/\s/g, ''))
  ) {
    errors.emailOrPhone = 'يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح';
  }

  if (!password) {
    errors.password = 'كلمة المرور مطلوبة';
  } else if (password.length < 6) {
    errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
  }

  return errors;
}

// ── Component ───────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const formErrors = validateForm(emailOrPhone, password);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) return;

    setIsLoading(true);
    try {
      // Mock login
      await login(
        {
          id: '1',
          firstName: 'أحمد',
          lastName: 'محمد',
          email: 'ahmed@example.com',
          phone: '+201234567890',
        },
        'mock-jwt-token',
      );
      (navigation as any).replace('Home');
    } catch {
      setErrors({ emailOrPhone: 'بيانات الدخول غير صحيحة' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} className="flex-1">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6">
              {/* Logo / App name */}
              <View className="mb-10 items-center">
                <Text className="mb-2 text-5xl">🔧</Text>
                <Text className="text-3xl text-white" style={{ fontFamily: FONTS.bold }}>
                  VeeParts
                </Text>
                <Text className="text-sm text-white/60" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                  {t('auth.loginSubtitle', 'سوق قطع غيار السيارات')}
                </Text>
              </View>

              {/* Email / phone input */}
              <View className="mb-4">
                <Text className="mb-1 text-sm text-white/80" style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}>
                  {t('auth.emailOrPhone', 'البريد الإلكتروني أو رقم الهاتف')}
                </Text>
                <TextInput
                  className={`rounded-xl bg-white/10 px-4 py-3.5 text-sm text-white ${
                    errors.emailOrPhone ? 'border border-error' : ''
                  }`}
                  style={{ fontFamily: FONTS.regular, textAlign: 'right', writingDirection: 'rtl' }}
                  placeholder={t('auth.emailOrPhonePlaceholder', 'أدخل البريد أو رقم الهاتف')}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={emailOrPhone}
                  onChangeText={(text) => {
                    setEmailOrPhone(text);
                    if (errors.emailOrPhone) setErrors((e) => ({ ...e, emailOrPhone: undefined }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.emailOrPhone && (
                  <Text className="mt-1 text-xs text-error" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                    {errors.emailOrPhone}
                  </Text>
                )}
              </View>

              {/* Password input */}
              <View className="mb-2">
                <Text className="mb-1 text-sm text-white/80" style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}>
                  {t('auth.password', 'كلمة المرور')}
                </Text>
                <View className="flex-row items-center rounded-xl bg-white/10">
                  <TouchableOpacity
                    className="px-4 py-3.5"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text className="text-sm text-white/50">
                      {showPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    className={`flex-1 py-3.5 pr-4 text-sm text-white ${
                      errors.password ? 'border border-error' : ''
                    }`}
                    style={{ fontFamily: FONTS.regular, textAlign: 'right', writingDirection: 'rtl' }}
                    placeholder={t('auth.passwordPlaceholder', 'أدخل كلمة المرور')}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                    }}
                    secureTextEntry={!showPassword}
                  />
                </View>
                {errors.password && (
                  <Text className="mt-1 text-xs text-error" style={{ fontFamily: FONTS.regular, writingDirection: 'rtl' }}>
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Forgot password */}
              <TouchableOpacity className="mb-6 self-start">
                <Text className="text-sm text-accent" style={{ fontFamily: FONTS.medium, writingDirection: 'rtl' }}>
                  {t('auth.forgotPassword', 'نسيت كلمة المرور؟')}
                </Text>
              </TouchableOpacity>

              {/* Login button */}
              <TouchableOpacity
                className={`items-center rounded-xl py-4 ${isLoading ? 'bg-accent/70' : 'bg-accent'}`}
                activeOpacity={0.8}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text className="text-base text-white" style={{ fontFamily: FONTS.bold }}>
                  {isLoading
                    ? t('auth.loggingIn', 'جاري تسجيل الدخول...')
                    : t('auth.login', 'تسجيل الدخول')}
                </Text>
              </TouchableOpacity>

              {/* Register link */}
              <View className="mt-6 flex-row items-center justify-center">
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text className="text-sm text-accent" style={{ fontFamily: FONTS.bold }}>
                    {t('auth.createAccount', 'إنشاء حساب')}
                  </Text>
                </TouchableOpacity>
                <Text className="mx-1 text-sm text-white/60" style={{ fontFamily: FONTS.regular }}>
                  {t('auth.noAccount', 'ليس لديك حساب؟')}
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
