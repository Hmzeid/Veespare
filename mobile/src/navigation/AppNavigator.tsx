import React from 'react';
import { I18nManager, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

// ── Placeholder screens (replace with real implementations) ──────────
const Placeholder = () => null;

// Auth screens
const LoginScreen = Placeholder;
const RegisterScreen = Placeholder;
const OnboardingScreen = Placeholder;

// Main screens
const HomeScreen = Placeholder;
const SearchScreen = Placeholder;
const CartScreen = Placeholder;
const OrdersScreen = Placeholder;
const ProfileScreen = Placeholder;

// Detail / modal screens
const ProductDetailScreen = Placeholder;
const StoreProfileScreen = Placeholder;
const CheckoutScreen = Placeholder;
const OrderDetailScreen = Placeholder;

// ── Type definitions ─────────────────────────────────────────────────
export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ProductDetail: { productId: string };
  StoreProfile: { storeId: string };
  Checkout: undefined;
  OrderDetail: { orderId: string };
};

// ── Shared header style ──────────────────────────────────────────────
const headerStyle = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: COLORS.textInverse,
  headerTitleStyle: {
    fontFamily: FONTS.bold,
    fontSize: 18,
  },
  headerTitleAlign: (I18nManager.isRTL ? 'right' : 'left') as 'right' | 'left' | 'center',
};

// ── Auth Stack ───────────────────────────────────────────────────────
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

// ── Bottom Tabs ──────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { t } = useTranslation();
  const getItemCount = useCartStore((s) => s.getItemCount);

  return (
    <Tab.Navigator
      screenOptions={{
        ...headerStyle,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontFamily: FONTS.semiBold,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 6,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('home.greeting'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: t('common.search'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: t('cart.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
          tabBarBadge: getItemCount() > 0 ? getItemCount() : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.accent,
            fontFamily: FONTS.bold,
            fontSize: 11,
          },
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: t('order.myOrders'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('garage.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root Stack ───────────────────────────────────────────────────────
const RootStack = createNativeStackNavigator<RootStackParamList>();

function MainStack() {
  const { t } = useTranslation();

  return (
    <RootStack.Navigator screenOptions={headerStyle}>
      <RootStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: t('product.description') }}
      />
      <RootStack.Screen
        name="StoreProfile"
        component={StoreProfileScreen}
        options={{ title: t('store.profile') }}
      />
      <RootStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: t('cart.checkout'), presentation: 'modal' }}
      />
      <RootStack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: t('order.tracking') }}
      />
    </RootStack.Navigator>
  );
}

// ── App Navigator (switches between Auth and Main) ───────────────────
export default function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  return <MainStack />;
}
