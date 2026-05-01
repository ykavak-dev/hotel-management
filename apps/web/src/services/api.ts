import axios from 'axios';

import type {
  SearchResponse,
  AvailabilityResponse,
  ReviewListResponse,
} from '../types/hotel';
import type { RoomType } from '@hotel/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export async function searchHotels(params: Record<string, unknown>): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>('/search/hotels', { params });
  return data;
}

export async function checkAvailability(
  hotelId: string,
  checkIn: string,
  checkOut: string,
  guests: number
): Promise<AvailabilityResponse> {
  const { data } = await api.get<AvailabilityResponse>('/search/availability', {
    params: { hotelId, checkIn, checkOut, guests },
  });
  return data;
}

export async function getHotelReviews(
  hotelId: string,
  page = 1,
  limit = 10
): Promise<ReviewListResponse> {
  const { data } = await api.get<ReviewListResponse>(`/reviews/hotel/${hotelId}`, {
    params: { page, limit },
  });
  return data;
}

export async function canWriteReview(hotelId: string): Promise<{ canReview: boolean; reason?: string }> {
  const { data } = await api.get<{ canReview: boolean; reason?: string }>('/reviews/can-review', {
    params: { hotelId },
  });
  return data;
}

export { queryClient } from '../lib/api/queryClient';
