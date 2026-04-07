import { create } from 'zustand';

export interface CartItem {
  storeProductId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  image: string;
  storeId: string;
  storeName: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (storeProductId: string) => void;
  updateQuantity: (storeProductId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item, quantity = 1) => {
    const { items } = get();
    const existing = items.find((i) => i.storeProductId === item.storeProductId);

    if (existing) {
      set({
        items: items.map((i) =>
          i.storeProductId === item.storeProductId
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        ),
      });
    } else {
      set({ items: [...items, { ...item, quantity }] });
    }
  },

  removeItem: (storeProductId) => {
    set({ items: get().items.filter((i) => i.storeProductId !== storeProductId) });
  },

  updateQuantity: (storeProductId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(storeProductId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.storeProductId === storeProductId ? { ...i, quantity } : i,
      ),
    });
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
