import { create } from "zustand";

export type Locale = "ar" | "en";

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  price: number;
  stock: number;
  condition: "new" | "used" | "refurbished";
  partNumber: string;
  description: string;
  compatibleCars: string[];
  images: string[];
  aiCategorized: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  total: number;
  status: "new" | "confirmed" | "prepared" | "shipped";
  createdAt: string;
  governorate: string;
}

export interface StoreProfile {
  nameAr: string;
  nameEn: string;
  description: string;
  logo: string;
  coverImage: string;
  phone: string;
  email: string;
  address: string;
  workingHours: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  deliveryZones: {
    zone: string;
    fee: number;
    time: string;
  }[];
}

interface DashboardState {
  locale: Locale;
  sidebarOpen: boolean;
  products: Product[];
  orders: Order[];
  storeProfile: StoreProfile | null;

  setLocale: (locale: Locale) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  setOrders: (orders: Order[]) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  setStoreProfile: (profile: StoreProfile) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  locale: "ar",
  sidebarOpen: true,
  products: [],
  orders: [],
  storeProfile: null,

  setLocale: (locale) => set({ locale }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setProducts: (products) => set({ products }),
  addProduct: (product) =>
    set((s) => ({ products: [...s.products, product] })),
  updateProduct: (id, data) =>
    set((s) => ({
      products: s.products.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
  deleteProduct: (id) =>
    set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
  setOrders: (orders) => set({ orders }),
  updateOrderStatus: (id, status) =>
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    })),
  setStoreProfile: (profile) => set({ storeProfile: profile }),
}));
