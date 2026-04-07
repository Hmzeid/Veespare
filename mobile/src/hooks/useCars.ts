import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface CarMake {
  id: string;
  name: string;
  nameAr: string;
  logo?: string;
}

export interface CarModel {
  id: string;
  name: string;
  nameAr: string;
  makeId: string;
}

export interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number;
  engine?: string;
  plateNumber?: string;
  mileage?: number;
}

export function useCarMakes() {
  return useQuery({
    queryKey: ['carMakes'],
    queryFn: async () => {
      const { data } = await api.get<CarMake[]>('/cars/makes');
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour – makes rarely change
  });
}

export function useCarModels(makeId: string) {
  return useQuery({
    queryKey: ['carModels', makeId],
    queryFn: async () => {
      const { data } = await api.get<CarModel[]>(`/cars/makes/${makeId}/models`);
      return data;
    },
    enabled: !!makeId,
    staleTime: 1000 * 60 * 60,
  });
}

export function useCarYears(makeId: string, modelId: string) {
  return useQuery({
    queryKey: ['carYears', makeId, modelId],
    queryFn: async () => {
      const { data } = await api.get<number[]>(
        `/cars/makes/${makeId}/models/${modelId}/years`,
      );
      return data;
    },
    enabled: !!makeId && !!modelId,
    staleTime: 1000 * 60 * 60,
  });
}

export function useCompatibleParts(
  makeId: string,
  modelId: string,
  year: number,
  params: { category?: string; page?: number } = {},
) {
  return useQuery({
    queryKey: ['compatibleParts', makeId, modelId, year, params],
    queryFn: async () => {
      const { data } = await api.get('/cars/compatible-parts', {
        params: { makeId, modelId, year, ...params },
      });
      return data;
    },
    enabled: !!makeId && !!modelId && !!year,
  });
}

export function useUserCars() {
  return useQuery({
    queryKey: ['userCars'],
    queryFn: async () => {
      const { data } = await api.get<UserCar[]>('/users/me/cars');
      return data;
    },
  });
}
