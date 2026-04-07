import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface Store {
  id: string;
  nameAr: string;
  nameEn: string;
  logo: string;
  coverImage?: string;
  rating: number;
  totalOrders: number;
  isVerified: boolean;
  governorate: string;
  address: string;
  workingHours: string;
  phone: string;
  productsCount: number;
  deliveryZones: string[];
}

export function useStores(params: { governorate?: string; search?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ['stores', params],
    queryFn: async () => {
      const { data } = await api.get('/stores', { params });
      return data;
    },
  });
}

export function useStoreDetail(storeId: string) {
  return useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const { data } = await api.get(`/stores/${storeId}`);
      return data;
    },
    enabled: !!storeId,
  });
}

export function useStoreProducts(
  storeId: string,
  params: { category?: string; search?: string; page?: number } = {},
) {
  return useQuery({
    queryKey: ['storeProducts', storeId, params],
    queryFn: async () => {
      const { data } = await api.get(`/stores/${storeId}/products`, { params });
      return data;
    },
    enabled: !!storeId,
  });
}
