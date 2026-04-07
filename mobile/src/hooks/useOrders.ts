import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface OrderItem {
  storeProductId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'completed' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  storeId: string;
  storeName: string;
  deliveryMethod: 'delivery' | 'pickup';
  paymentMethod: string;
  address?: string;
  notes?: string;
  createdAt: string;
  estimatedDelivery?: string;
}

interface CreateOrderPayload {
  items: { storeProductId: string; quantity: number }[];
  storeId: string;
  deliveryMethod: 'delivery' | 'pickup';
  paymentMethod: string;
  addressId?: string;
  notes?: string;
}

export function useOrders(params: { page?: number; status?: string } = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await api.get('/orders', { params });
      return data;
    },
  });
}

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${orderId}`);
      return data;
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const { data } = await api.post('/orders', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data } = await api.patch(`/orders/${orderId}/status`, { status });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
