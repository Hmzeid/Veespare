import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  oemNumber: string;
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  images: string[];
  minPrice: number;
  maxPrice: number;
  storeCount: number;
}

export interface StoreProduct {
  id: string;
  product: Product;
  storeId: string;
  storeName: string;
  storeRating: number;
  price: number;
  stock: number;
  warranty: number;
  condition: string;
}

interface ProductsParams {
  category?: string;
  search?: string;
  carMake?: string;
  carModel?: string;
  carYear?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
}

export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await api.get('/products', { params });
      return data;
    },
  });
}

export function useProductDetail(productId: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}`);
      return data;
    },
    enabled: !!productId,
  });
}

export function usePriceComparison(productId: string) {
  return useQuery({
    queryKey: ['priceComparison', productId],
    queryFn: async () => {
      const { data } = await api.get<StoreProduct[]>(
        `/products/${productId}/price-comparison`,
      );
      return data;
    },
    enabled: !!productId,
  });
}

export function useSearchProducts(query: string, params: Omit<ProductsParams, 'search'> = {}) {
  return useQuery({
    queryKey: ['searchProducts', query, params],
    queryFn: async () => {
      const { data } = await api.get('/products/search', {
        params: { search: query, ...params },
      });
      return data;
    },
    enabled: query.length >= 2,
  });
}
