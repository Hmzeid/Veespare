import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.veeparts.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'ar',
  },
});

// Request interceptor – attach auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore may fail on first launch; continue without token
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Arabic error messages mapped by HTTP status
const ARABIC_ERROR_MESSAGES: Record<number, string> = {
  400: 'طلب غير صالح. يرجى التحقق من البيانات المدخلة',
  401: 'غير مصرح. يرجى تسجيل الدخول مرة أخرى',
  403: 'ليس لديك صلاحية للوصول إلى هذا المحتوى',
  404: 'المحتوى المطلوب غير موجود',
  408: 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى',
  409: 'تعارض في البيانات. يرجى المحاولة مرة أخرى',
  422: 'البيانات المدخلة غير صحيحة',
  429: 'عدد كبير من الطلبات. يرجى الانتظار قليلاً',
  500: 'خطأ في الخادم. يرجى المحاولة لاحقاً',
  502: 'الخادم غير متاح حالياً',
  503: 'الخدمة غير متاحة مؤقتاً',
};

const DEFAULT_ERROR_MESSAGE = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
const NETWORK_ERROR_MESSAGE = 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الشبكة';

export interface ApiError {
  message: string;
  messageAr: string;
  status: number | null;
}

// Response interceptor – normalise errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status ?? null;
    const serverMessage = error.response?.data?.message;

    let messageAr: string;

    if (!error.response) {
      // Network / timeout error
      messageAr = NETWORK_ERROR_MESSAGE;
    } else {
      messageAr = (status && ARABIC_ERROR_MESSAGES[status]) || DEFAULT_ERROR_MESSAGE;
    }

    const apiError: ApiError = {
      message: serverMessage || error.message,
      messageAr,
      status,
    };

    return Promise.reject(apiError);
  },
);

export default api;
